// Sépare les cours d'un élève en « à venir » (du plus proche au plus lointain) et
// « passés » (du plus récent au plus ancien). Un cours déjà commencé est passé.
export function repartirCours<T extends { debut: Date }>(
  cours: T[],
  now: Date,
): { aVenir: T[]; passes: T[] } {
  const t = now.getTime();
  const aVenir = cours
    .filter((c) => c.debut.getTime() > t)
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());
  const passes = cours
    .filter((c) => c.debut.getTime() <= t)
    .sort((a, b) => b.debut.getTime() - a.debut.getTime());
  return { aVenir, passes };
}
