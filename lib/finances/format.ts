// U+00A0 = espace insecable, U+202F = espace fine insecable. Intl.NumberFormat fr-FR
// en insere une avant le symbole euro (selon la version d'ICU) ; on la normalise.
const ESPACES_INSECABLES = /[  ]/g;

export function formatEuros(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  const safe = Number.isFinite(n) ? n : 0;
  // Montants ronds sans décimales (« 40 € ») ; décimales affichées seulement si besoin (« 45,50 € »).
  const fractionDigits = Number.isInteger(safe) ? 0 : 2;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  })
    .format(safe)
    .replace(ESPACES_INSECABLES, " ");
}
