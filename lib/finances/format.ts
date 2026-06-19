// U+00A0 = espace insecable, U+202F = espace fine insecable. Intl.NumberFormat fr-FR
// en insere une avant le symbole euro (selon la version d'ICU) ; on la normalise.
const ESPACES_INSECABLES = /[  ]/g;

export function formatEuros(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
    .format(safe)
    .replace(ESPACES_INSECABLES, " ");
}
