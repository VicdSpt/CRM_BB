// Format du cookie « flash » : message de confirmation affiché une fois après une action.
// « <id>|<message encodé> » : l'id (horodatage) distingue deux messages identiques successifs.

export const COOKIE_FLASH = "flash";

export type Flash = { id: string; message: string };

export function encoderFlash(message: string, maintenant: number): string {
  return `${maintenant}|${encodeURIComponent(message)}`;
}

export function decoderFlash(valeur: string | undefined): Flash | null {
  if (!valeur) return null;
  const i = valeur.indexOf("|");
  if (i <= 0 || i === valeur.length - 1) return null;
  try {
    return { id: valeur.slice(0, i), message: decodeURIComponent(valeur.slice(i + 1)) };
  } catch {
    return null;
  }
}
