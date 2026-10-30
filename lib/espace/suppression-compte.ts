// Suppression du compte par l'élève (RGPD, droit à l'effacement).
// Sans historique, la fiche disparaît. Avec des cours, packs ou paiements, elle est
// anonymisée : le coach garde ses montants et ses dates (comptabilité), sans pouvoir
// savoir de qui il s'agit.

export const CONFIRMATION_SUPPRESSION = "SUPPRIMER";

export type Historique = { participations: number; packs: number; paiements: number };

export function modeSuppression(h: Historique): "supprimer" | "anonymiser" {
  return h.participations + h.packs + h.paiements > 0 ? "anonymiser" : "supprimer";
}

export const DONNEES_ANONYMISEES = {
  prenom: "Élève",
  nom: "supprimé",
  email: null,
  telephone: null,
  adresse: null,
  notes: null,
  motDePasse: null,
  statutCompte: "AUCUN",
  archive: true,
  inscriptionPrenom: null,
  inscriptionNom: null,
  inscriptionTelephone: null,
} as const;

export function confirmationValide(saisie: unknown): boolean {
  return typeof saisie === "string" && saisie.trim().toUpperCase() === CONFIRMATION_SUPPRESSION;
}
