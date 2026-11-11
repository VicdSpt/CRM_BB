// Format du cookie « flash » : message de confirmation affiché une fois après une action.
// « <id>|<ton>|<message encodé> » : l'id (horodatage) distingue deux messages identiques
// successifs ; le ton choisit la couleur (vert pour un succès, rouge pour une suppression
// ou une annulation).

export const COOKIE_FLASH = "flash";

export const TONS_FLASH = ["succes", "alerte"] as const;
export type TonFlash = (typeof TONS_FLASH)[number];

export type Flash = { id: string; ton: TonFlash; message: string };

export function encoderFlash(
  message: string,
  maintenant: number,
  ton: TonFlash = "succes",
): string {
  return `${maintenant}|${ton}|${encodeURIComponent(message)}`;
}

export function decoderFlash(valeur: string | undefined): Flash | null {
  const [id, ton, message] = valeur?.split("|", 3) ?? [];
  if (!id || !message || !(TONS_FLASH as readonly string[]).includes(ton ?? "")) return null;
  try {
    return { id, ton: ton as TonFlash, message: decodeURIComponent(message) };
  } catch {
    return null;
  }
}
