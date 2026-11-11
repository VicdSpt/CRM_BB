// Lien d'inscription envoyé ou affiché en QR code par le coach. L'adresse du site n'est
// jamais écrite dans le code (dépôt public) : elle vient de la requête du coach.

type EnTetes = {
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
};

const premier = (v?: string | null) => v?.split(",")[0]?.trim() || null;

// Adresse locale (poste de dev, téléphone du réseau local) : servie en http.
const estLocal = (hote: string) =>
  /^(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(hote);

export function lienInscription(e: EnTetes): string | null {
  const hote = premier(e.forwardedHost) ?? premier(e.host);
  if (!hote) return null;
  const protocole = premier(e.forwardedProto) ?? (estLocal(hote) ? "http" : "https");
  return `${protocole}://${hote}/inscription`;
}
