"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { decideInscription, parseInscriptionForm } from "@/lib/eleves/inscription";

export type InscriptionState = { errors?: Record<string, string>; message?: string };

export async function inscrireEleve(
  _prev: InscriptionState,
  formData: FormData,
): Promise<InscriptionState> {
  const result = parseInscriptionForm(formData);
  if (!result.success) return { errors: result.errors };
  const { prenom, nom, email, telephone, motDePasse } = result.data;

  const [existant, coach] = await Promise.all([
    prisma.eleve.findUnique({
      where: { email },
      select: { id: true, statutCompte: true, telephone: true },
    }),
    prisma.coach.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
  ]);
  const decision = decideInscription(existant, !!coach);
  if (decision.type === "refus") return { errors: { email: decision.message } };

  const hash = await hashPassword(motDePasse);
  if (decision.type === "creer") {
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
  } else {
    // Fiche du coach : on garde son prénom/nom, on complète le téléphone s'il manque.
    // L'identité saisie est conservée à part pour que le coach la compare à la fiche
    // avant de valider (n'importe qui peut taper l'email d'un autre élève).
    await prisma.eleve.update({
      where: { id: decision.eleveId },
      data: {
        motDePasse: hash,
        statutCompte: "EN_ATTENTE",
        inscriptionPrenom: prenom,
        inscriptionNom: nom,
        inscriptionTelephone: telephone,
        ...(existant?.telephone ? {} : { telephone }),
      },
    });
  }

  try {
    await signIn("credentials", { email, password: motDePasse, redirectTo: "/espace/attente" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { message: "Compte créé. Connecte-toi pour continuer." };
  }
  return {};
}
