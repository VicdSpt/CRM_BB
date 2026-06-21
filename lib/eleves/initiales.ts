export function initiales(prenom: string, nom: string): string {
  const p = prenom.trim()[0] ?? "";
  const n = nom.trim()[0] ?? "";
  return (p + n).toUpperCase() || "?";
}
