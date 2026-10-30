// Logique pure du script de sauvegarde (scripts/sauvegarde.ts).

// L'URL de prod n'est jamais active dans .env : elle y figure en commentaire
// (« # DATABASE_URL=... »). On ne retient que la ligne qui pointe sur l'hôte de prod.
export function urlProdDepuisEnv(texteEnv: string, hoteProd: string): string | null {
  if (!hoteProd.trim()) return null;
  for (const ligne of texteEnv.split(/\r?\n/)) {
    const m = ligne.match(/^\s*#\s*DATABASE_URL\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    const url = m[1]!.replace(/^["']|["']$/g, "");
    if (url.includes(hoteProd.trim())) return url;
  }
  return null;
}

// Heure UTC, à la minute ; « : » est interdit dans les noms de fichiers Windows.
export function nomFichierSauvegarde(date: Date, cible: "prod" | "dev"): string {
  const iso = date.toISOString();
  return `crm-bb-${cible}-${iso.slice(0, 10)}_${iso.slice(11, 13)}-${iso.slice(14, 16)}.json`;
}
