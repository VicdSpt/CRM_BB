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

// Roue « infinie » : la liste est répétée au-dessus et en dessous d'une copie centrale.
// Assez de copies pour qu'un grand coup de doigt (≈ 3 000 px) n'atteigne pas le bord.
const DEFILEMENT_MAX_ELEMENTS = 75; // 75 × 40 px = 3 000 px

export function copiesParCote(nbValeurs: number): number {
  return Math.max(3, Math.ceil(DEFILEMENT_MAX_ELEMENTS / nbValeurs));
}

// Après l'arrêt, on saute (sans animation) au même élément dans la copie centrale :
// le contenu étant identique, le saut est invisible et la roue repart dans les deux sens.
export function indexRecentre(index: number, nbValeurs: number, cote: number): number {
  const modulo = ((index % nbValeurs) + nbValeurs) % nbValeurs;
  return cote * nbValeurs + modulo;
}
