"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEleve } from "@/lib/auth/require-eleve";
import { peutSeDesinscrire } from "./regles";
import { reserverDansTransaction } from "./reservation";

export type ResultatAction = { erreur?: string };

// Toutes les actions élève agissent sur l'élève de la SESSION, jamais sur un id reçu.
export async function reserverCours(seanceId: string): Promise<ResultatAction> {
  const { eleve } = await requireEleve();
  const resultat = await reserverDansTransaction(seanceId, eleve.id, new Date());
  revalidatePath("/espace");
  return resultat;
}

export async function annulerReservation(seanceId: string): Promise<ResultatAction> {
  const { eleve } = await requireEleve();
  const participation = await prisma.participation.findUnique({
    where: { seanceId_eleveId: { seanceId, eleveId: eleve.id } },
    include: { seance: { select: { dateHeureDebut: true, statut: true, capacite: true } } },
  });
  if (!participation) return { erreur: "Tu n'es pas inscrit à ce cours." };

  const verdict = peutSeDesinscrire(
    {
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
  revalidatePath("/espace");
  return {};
}
