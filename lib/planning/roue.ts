// Logique pure de la roue d'heure (mobile), façon réveil de téléphone.

const deux = (n: number) => String(n).padStart(2, "0");

export const HEURES_ROUE = Array.from({ length: 24 }, (_, h) => deux(h));

export const PAS_MINUTES_ROUE = 5;

// Minutes de 5 en 5 ; une minute hors pas (séance existante, ex. 47) est insérée à sa place.
export function minutesRoue(minuteActuelle?: string): string[] {
  const minutes = Array.from({ length: 60 / PAS_MINUTES_ROUE }, (_, i) =>
    deux(i * PAS_MINUTES_ROUE),
  );
  if (minuteActuelle && !minutes.includes(minuteActuelle)) {
    minutes.push(minuteActuelle);
    minutes.sort();
  }
  return minutes;
}

// Élément calé au centre après un défilement, borné (le rebond iOS peut dépasser).
export function indexAuCentre(scrollTop: number, hauteurElement: number, nb: number): number {
  return Math.min(nb - 1, Math.max(0, Math.round(scrollTop / hauteurElement)));
}
