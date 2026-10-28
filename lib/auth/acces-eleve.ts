import type { StatutCompte } from "@prisma/client";

export type EtatAccesEleve = "valide" | "en_attente" | "inactif";

// Ce qu'un élève connecté a le droit de voir, relu en base à chaque requête :
// la validation (ou le refus) par le coach arrive après la connexion.
export function etatAccesEleve(
  eleve: { statutCompte: StatutCompte; archive: boolean } | null,
): EtatAccesEleve {
  if (!eleve || eleve.archive || eleve.statutCompte === "AUCUN") return "inactif";
  return eleve.statutCompte === "VALIDE" ? "valide" : "en_attente";
}
