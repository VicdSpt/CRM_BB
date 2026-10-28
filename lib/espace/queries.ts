import type { StatutReglement, StatutSeance } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/planning/dates";
import { HORIZON_JOURS } from "./regles";

export type CoursEleve = {
  id: string;
  debut: Date;
  dureeMinutes: number;
  lieu: string | null;
  prix: string;
  capacite: number;
  nbInscrits: number;
  statut: StatutSeance;
  inscrit: boolean;
  statutReglement: StatutReglement | null;
};

// Cours collectifs à venir vus par un élève : les cours planifiés, plus ceux annulés
// auxquels il était inscrit. On ne lit jamais les autres participants (seulement leur nombre).
export async function coursAVenir(eleveId: string, now: Date): Promise<CoursEleve[]> {
  const seances = await prisma.seance.findMany({
    where: {
      type: "COLLECTIF",
      dateHeureDebut: { gt: now, lte: addDays(now, HORIZON_JOURS) },
      OR: [{ statut: "PLANIFIEE" }, { statut: "ANNULEE", participations: { some: { eleveId } } }],
    },
    orderBy: { dateHeureDebut: "asc" },
    select: {
      id: true,
      dateHeureDebut: true,
      dureeMinutes: true,
      lieu: true,
      prixReference: true,
      capacite: true,
      statut: true,
      _count: { select: { participations: true } },
      participations: { where: { eleveId }, select: { statutReglement: true } },
    },
  });

  return seances.map((s) => ({
    id: s.id,
    debut: s.dateHeureDebut,
    dureeMinutes: s.dureeMinutes,
    lieu: s.lieu,
    prix: s.prixReference.toString(),
    capacite: s.capacite,
    nbInscrits: s._count.participations,
    statut: s.statut,
    inscrit: s.participations.length > 0,
    statutReglement: s.participations[0]?.statutReglement ?? null,
  }));
}
