export function prochaineSeance<T extends { dateHeureDebut: Date }>(
  seances: T[],
  maintenant: Date,
): T | null {
  return seances.find((s) => s.dateHeureDebut.getTime() >= maintenant.getTime()) ?? null;
}
