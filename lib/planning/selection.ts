import type { Prisma } from "@prisma/client";

// Élèves proposés dans le formulaire de séance : les élèves actifs (hors comptes en
// attente de validation), PLUS les participants actuels quel que soit leur statut —
// sinon enregistrer la séance les retirerait sans que le coach l'ait voulu.
export function whereElevesSelectionnables(participantIds: string[]): Prisma.EleveWhereInput {
  return {
    OR: [{ archive: false, statutCompte: { not: "EN_ATTENTE" } }, { id: { in: participantIds } }],
  };
}
