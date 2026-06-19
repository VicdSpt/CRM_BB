export function formatEuros(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
    .format(safe)
    // Normalise les espaces insecables (U+00A0) et fines insecables (U+202F)
    // qu'Intl.NumberFormat fr-FR insere avant le symbole euro, selon la version d'ICU.
    .replace(/[  ]/g, " ");
}
