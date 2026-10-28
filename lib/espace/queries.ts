import type { StatutReglement, StatutSeance, TypeSeance } from "@prisma/client";

export type MonCours = {
  seanceId: string;
  type: TypeSeance;
  statut: StatutSeance;
  debut: Date;
  dureeMinutes: number;
  lieu: string | null;
  montant: string;
  statutReglement: StatutReglement;
};

// Historique complet de l'élève (séances privées ET collectives) : uniquement ses
// propres participations, jamais celles des autres.
export async function mesCours(eleveId: string): Promise<MonCours[]> {
  const participations = await prisma.participation.findMany({
    where: { eleveId },
    select: {
      montant: true,
      statutReglement: true,
      seance: {
        select: {
          id: true,
          type: true,
          statut: true,
          dateHeureDebut: true,
          dureeMinutes: true,
          lieu: true,
        },
      },
    },
  });
  return participations.map((p) => ({
    seanceId: p.seance.id,
    type: p.seance.type,
    statut: p.seance.statut,
    debut: p.seance.dateHeureDebut,
    dureeMinutes: p.seance.dureeMinutes,
    lieu: p.seance.lieu,
    montant: p.montant.toString(),
    statutReglement: p.statutReglement,
  }));
}
import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/planning/dates";
import { HORIZON_JOURS } from "./regles";

export type CoursEleve = {
  id: string;
  type: "COLLECTIF";
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
    type: "COLLECTIF" as const,
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
