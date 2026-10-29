"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { decideInscription, parseInscriptionForm } from "@/lib/eleves/inscription";
import { estDoublonUnique } from "@/lib/prisma-erreurs";
import { headers } from "next/headers";
import { messageTropDeTentatives } from "@/lib/securite/limite";
import { enregistrerInscription, verifierInscription } from "@/lib/securite/tentatives";

const COMPTE_EXISTANT = "Un compte existe déjà avec cet email.";

export type InscriptionState = { errors?: Record<string, string>; message?: string };

export async function inscrireEleve(
  _prev: InscriptionState,
  formData: FormData,
): Promise<InscriptionState> {
  // Au plus 5 inscriptions par heure depuis une même adresse IP (faux comptes en masse).
  const entetes = await headers();
  const limite = await verifierInscription(entetes);
  if (limite.bloque) return { message: messageTropDeTentatives(limite.minutesRestantes) };

  const result = parseInscriptionForm(formData);
  if (!result.success) return { errors: result.errors };
  const { prenom, nom, email, telephone, motDePasse } = result.data;

  const [existant, coach] = await Promise.all([
    prisma.eleve.findUnique({
      where: { email },
      select: { id: true, statutCompte: true, archive: true, telephone: true },
    }),
    prisma.coach.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
  ]);
  const decision = decideInscription(existant, !!coach);
  if (decision.type === "refus") return { errors: { email: decision.message } };

  const hash = await hashPassword(motDePasse);
  if (decision.type === "creer") {
    try {
      await prisma.eleve.create({
        data: {
          prenom,
          nom,
          email,
          telephone,
          motDePasse: hash,
          statutCompte: "EN_ATTENTE",
          creeParInscription: true,
        },
      });
    } catch (e) {
      // Une autre inscription a pris cet email entre la vérification et la création.
      if (estDoublonUnique(e)) return { errors: { email: COMPTE_EXISTANT } };
      throw e;
    }
  } else {
    // Fiche du coach : on garde son prénom/nom, on complète le téléphone s'il manque.
    // L'identité saisie est conservée à part pour que le coach la compare à la fiche
    // avant de valider (n'importe qui peut taper l'email d'un autre élève).
    // `statutCompte: "AUCUN"` dans le filtre : si deux inscriptions visent la même fiche
    // en même temps, une seule la rattache (la seconde ne met rien à jour).
    const { count } = await prisma.eleve.updateMany({
      where: { id: decision.eleveId, statutCompte: "AUCUN" },
      data: {
        motDePasse: hash,
        statutCompte: "EN_ATTENTE",
        inscriptionPrenom: prenom,
        inscriptionNom: nom,
        inscriptionTelephone: telephone,
        ...(existant?.telephone ? {} : { telephone }),
      },
    });
    if (count === 0) return { errors: { email: COMPTE_EXISTANT } };
  }
  await enregistrerInscription(entetes);

  try {
    await signIn("credentials", { email, password: motDePasse, redirectTo: "/espace/attente" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { message: "Compte créé. Connecte-toi pour continuer." };
  }
  return {};
}
