export function formatJourFr(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export function formatHeureFr(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

// "du 16 au 22 juin" (même mois) ou "du 30 juin au 6 juillet" (mois différents).
export function formatPlageSemaine(debut: Date, fin: Date): string {
  const jour = (d: Date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(d);
  const jourMois = (d: Date) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(d);
  const memeMois = debut.getMonth() === fin.getMonth() && debut.getFullYear() === fin.getFullYear();
  return memeMois
    ? `du ${jour(debut)} au ${jourMois(fin)}`
    : `du ${jourMois(debut)} au ${jourMois(fin)}`;
}

export function toDateParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateParam(s?: string): Date {
  if (s) {
    const [y, m, d] = s.split("-").map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  return new Date();
}
