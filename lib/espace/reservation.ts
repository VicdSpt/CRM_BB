import { prisma } from "@/lib/prisma";
import { peutSInscrire } from "./regles";

// Logique de réservation SANS garde d'accès (pas de "use server" : ce module reçoit un
// eleveId et ne doit jamais être appelable depuis le navigateur). Appelée par l'action
// `reserverCours` (élève de la session) et par le script de vérification de concurrence.
export async function reserverDansTransaction(
  seanceId: string,
  eleveId: string,
  now: Date,
): Promise<{ erreur?: string }> {
  return prisma.$transaction(async (tx) => {
    // Verrou sur la ligne de la séance : deux réservations simultanées s'exécutent
    // l'une après l'autre, la seconde voit donc le bon nombre d'inscrits.
    await tx.$queryRaw`SELECT id FROM "Seance" WHERE id = ${seanceId} FOR UPDATE`;

    const seance = await tx.seance.findUnique({
      where: { id: seanceId },
      select: {
        type: true,
        statut: true,
        dateHeureDebut: true,
        capacite: true,
        prixReference: true,
        _count: { select: { participations: true } },
        participations: { where: { eleveId }, select: { id: true } },
      },
    });
    if (!seance || seance.type !== "COLLECTIF") return { erreur: "Cours introuvable." };

    const verdict = peutSInscrire(
      {
        statut: seance.statut,
        debut: seance.dateHeureDebut,
        nbInscrits: seance._count.participations,
        capacite: seance.capacite,
        inscrit: seance.participations.length > 0,
        statutReglement: null,
      },
      now,
    );
    if (!verdict.ok) return { erreur: verdict.raison };

    await tx.participation.create({
      data: { seanceId, eleveId, montant: seance.prixReference },
    });
    return {};
  });
}
