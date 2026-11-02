// Logique pure du choix de date et d'heure d'une séance (calendrier + créneaux).
// Dates au format « AAAA-MM-JJ », heures « HH:mm » : la valeur envoyée au serveur
// reste celle d'un champ datetime-local (« AAAA-MM-JJTHH:mm »).

const deux = (n: number) => String(n).padStart(2, "0");

export function isoJour(annee: number, mois: number, jour: number): string {
  return `${annee}-${deux(mois + 1)}-${deux(jour)}`;
}

// Semaines du mois (lundi → dimanche), complétées par des cases vides. `mois` va de 0 à 11.
export function grilleMois(annee: number, mois: number): (string | null)[][] {
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const decalage = (new Date(annee, mois, 1).getDay() + 6) % 7; // lundi = 0
  const cases: (string | null)[] = Array(decalage).fill(null);
  for (let j = 1; j <= nbJours; j++) cases.push(isoJour(annee, mois, j));
  while (cases.length % 7 !== 0) cases.push(null);
  const semaines: (string | null)[][] = [];
  for (let i = 0; i < cases.length; i += 7) semaines.push(cases.slice(i, i + 7));
  return semaines;
}

const enMinutes = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

export function creneauxHoraires(debut: string, fin: string, pasMinutes: number): string[] {
  const creneaux: string[] = [];
  for (let m = enMinutes(debut); m <= enMinutes(fin); m += pasMinutes) {
    creneaux.push(`${deux(Math.floor(m / 60))}:${deux(m % 60)}`);
  }
  return creneaux;
}

export function separerDateHeure(valeur: string | undefined): {
  date: string | null;
  heure: string | null;
} {
  const m = valeur?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? { date: m[1]!, heure: m[2]! } : { date: null, heure: null };
}

// « Mardi 10 novembre 2026 à 18:30 » (date lue en heure locale, sans décalage UTC).
export function libelleDateHeure(date: string, heure: string | null): string {
  const [a, m, j] = date.split("-").map(Number);
  const texte = new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(a!, m! - 1, j!));
  const capitalise = texte.charAt(0).toUpperCase() + texte.slice(1);
  return heure ? `${capitalise} à ${heure}` : capitalise;
}
