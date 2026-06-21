export function libelleStatut(statut: "PLANIFIEE" | "REALISEE" | "ANNULEE"): string {
  if (statut === "REALISEE") return "Réalisée";
  if (statut === "ANNULEE") return "Annulée";
  return "Planifiée";
}

export function libelleType(type: "PRIVE" | "COLLECTIF"): string {
  return type === "PRIVE" ? "Privé" : "Collectif";
}
