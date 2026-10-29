import { createHash } from "node:crypto";

// Limitation des tentatives (connexion, inscription) contre les essais de mots de passe
// en série et la création de faux comptes en masse.

export type Limite = { max: number; fenetreMinutes: number };

export const LIMITES = {
  connexionEmail: { max: 5, fenetreMinutes: 15 },
  connexionIp: { max: 20, fenetreMinutes: 15 },
  inscriptionIp: { max: 5, fenetreMinutes: 60 },
} as const satisfies Record<string, Limite>;

export type VerdictLimite = { bloque: false } | { bloque: true; minutesRestantes: number };

const MINUTE_MS = 60_000;

// Bloqué tant que la fenêtre contient `max` tentatives ou plus ; le blocage dure jusqu'à ce
// qu'assez de tentatives en sortent pour repasser sous le seuil.
export function verdictLimite(tentatives: Date[], limite: Limite, now: Date): VerdictLimite {
  const debutFenetre = now.getTime() - limite.fenetreMinutes * MINUTE_MS;
  const recentes = tentatives
    .map((d) => d.getTime())
    .filter((t) => t > debutFenetre)
    .sort((a, b) => a - b);
  if (recentes.length < limite.max) return { bloque: false };

  const quiDoitSortir = recentes[recentes.length - limite.max];
  const finBlocage = quiDoitSortir + limite.fenetreMinutes * MINUTE_MS;
  return {
    bloque: true,
    minutesRestantes: Math.max(1, Math.ceil((finBlocage - now.getTime()) / MINUTE_MS)),
  };
}

export function messageTropDeTentatives(minutes: number): string {
  return `Trop de tentatives. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

// L'IP n'est jamais stockée en clair : seulement son empreinte, salée par un secret.
export function empreinteIp(ip: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}

// Derrière Vercel, la première adresse de x-forwarded-for est celle du visiteur.
export function ipDepuisEntetes(entetes: Headers): string {
  const transmise = entetes.get("x-forwarded-for")?.split(",")[0]?.trim();
  return transmise || entetes.get("x-real-ip")?.trim() || "inconnue";
}
