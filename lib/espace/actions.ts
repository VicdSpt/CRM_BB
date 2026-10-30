"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEleve } from "@/lib/auth/require-eleve";
import { peutSeDesinscrire } from "./regles";
import { reserverDansTransaction } from "./reservation";
import { parseProfilForm, verifierEmailLibre } from "./profil";
import { parseSeanceId } from "./ids";
import { estDoublonUnique } from "@/lib/prisma-erreurs";
import { signOut } from "@/auth";
import { effacerEchecsConnexion } from "@/lib/securite/tentatives";
import { DONNEES_ANONYMISEES, confirmationValide, modeSuppression } from "./suppression-compte";

export type ResultatAction = { erreur?: string };
export type ProfilState = { errors?: Record<string, string>; message?: string };

export async function updateProfil(_prev: ProfilState, formData: FormData): Promise<ProfilState> {
  const { eleve } = await requireEleve();
  const result = parseProfilForm(formData);
  if (!result.success) return { errors: result.errors };
  const { email, telephone, adresse } = result.data;

  const [eleveAvecEmail, coach] = await Promise.all([
    prisma.eleve.findUnique({ where: { email }, select: { id: true } }),
    prisma.coach.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
  ]);
  const erreurEmail = verifierEmailLibre(email, {
    eleveIdCourant: eleve.id,
    eleveAvecEmail,
    emailEstCoach: !!coach,
  });
  if (erreurEmail) return { errors: { email: erreurEmail } };

  // Uniquement ces trois champs : jamais prénom, nom ni les notes du coach.
  try {
    await prisma.eleve.update({
      where: { id: eleve.id },
      data: { email, telephone, adresse: adresse ?? null },
    });
  } catch (e) {
    // Quelqu'un a pris cet email entre la vérification et l'enregistrement.
    if (estDoublonUnique(e)) return { errors: { email: "Cet email est déjà utilisé." } };
    throw e;
  }
  revalidatePath("/espace");
  return { message: "Profil enregistré." };
}

// Suppression du compte par l'élève lui-même (RGPD). Ses réservations futures non payées
// sont d'abord annulées (la place se libère) ; ensuite la fiche est supprimée si rien ne
// reste, sinon anonymisée pour préserver la comptabilité du coach.
export async function supprimerMonCompte(
  _prev: ResultatAction,
  formData: FormData,
): Promise<ResultatAction> {
  const { eleve } = await requireEleve();
  if (!confirmationValide(formData.get("confirmation"))) {
    return { erreur: "Tape SUPPRIMER pour confirmer." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.participation.deleteMany({
      where: {
        eleveId: eleve.id,
        statutReglement: "A_REGLER",
        packId: null,
        seance: { statut: "PLANIFIEE", dateHeureDebut: { gt: new Date() } },
      },
    });
    const [participations, packs, paiements] = await Promise.all([
      tx.participation.count({ where: { eleveId: eleve.id } }),
      tx.pack.count({ where: { eleveId: eleve.id } }),
      tx.paiement.count({ where: { eleveId: eleve.id } }),
    ]);
    if (modeSuppression({ participations, packs, paiements }) === "supprimer") {
      await tx.eleve.delete({ where: { id: eleve.id } });
    } else {
      await tx.eleve.update({ where: { id: eleve.id }, data: DONNEES_ANONYMISEES });
    }
  });
  if (eleve.email) await effacerEchecsConnexion(eleve.email);

  await signOut({ redirectTo: "/login?compte=supprime" });
  return {};
}

// Toutes les actions élève agissent sur l'élève de la SESSION, jamais sur un id reçu.
export async function reserverCours(seanceIdRecu: unknown): Promise<ResultatAction> {
  const { eleve } = await requireEleve();
  const seanceId = parseSeanceId(seanceIdRecu);
  if (!seanceId) return { erreur: "Cours introuvable." };
  const resultat = await reserverDansTransaction(seanceId, eleve.id, new Date());
  // Le profil (/espace) et le catalogue (/espace/cours) affichent tous deux les inscriptions.
  revalidatePath("/espace", "layout");
  return resultat;
}

export async function annulerReservation(seanceIdRecu: unknown): Promise<ResultatAction> {
  const { eleve } = await requireEleve();
  const seanceId = parseSeanceId(seanceIdRecu);
  if (!seanceId) return { erreur: "Cours introuvable." };
  const participation = await prisma.participation.findUnique({
    where: { seanceId_eleveId: { seanceId, eleveId: eleve.id } },
    include: {
      seance: { select: { type: true, dateHeureDebut: true, statut: true, capacite: true } },
    },
  });
  if (!participation) return { erreur: "Tu n'es pas inscrit à ce cours." };

  const verdict = peutSeDesinscrire(
    {
      type: participation.seance.type,
      statut: participation.seance.statut,
      debut: participation.seance.dateHeureDebut,
      nbInscrits: 0,
      capacite: participation.seance.capacite,
      inscrit: true,
      statutReglement: participation.statutReglement,
    },
    new Date(),
  );
  if (!verdict.ok) return { erreur: verdict.raison };

  await prisma.participation.delete({ where: { id: participation.id } });
  revalidatePath("/espace", "layout");
  return {};
}
