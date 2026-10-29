import type { TypeTentative } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  empreinteIp,
  ipDepuisEntetes,
  LIMITES,
  verdictLimite,
  type Limite,
  type VerdictLimite,
} from "./limite";

const RETENTION_MS = 24 * 60 * 60_000;

// Clé d'une adresse IP : son empreinte salée (jamais l'IP en clair en base).
export function cleIp(entetes: Headers): string {
  return `ip:${empreinteIp(ipDepuisEntetes(entetes), process.env.AUTH_SECRET ?? "")}`;
}

const cleEmail = (email: string) => `email:${email.trim().toLowerCase()}`;

async function verifier(type: TypeTentative, cle: string, limite: Limite): Promise<VerdictLimite> {
  const now = new Date();
  const lignes = await prisma.tentativeAcces.findMany({
    where: { type, cle, creeLe: { gt: new Date(now.getTime() - limite.fenetreMinutes * 60_000) } },
    select: { creeLe: true },
  });
  return verdictLimite(
    lignes.map((l) => l.creeLe),
    limite,
    now,
  );
}

async function enregistrer(type: TypeTentative, cles: string[]): Promise<void> {
  await prisma.tentativeAcces.createMany({ data: cles.map((cle) => ({ type, cle })) });
  // Purge au fil de l'eau : la table ne garde que les dernières 24 h.
  await prisma.tentativeAcces.deleteMany({
    where: { creeLe: { lt: new Date(Date.now() - RETENTION_MS) } },
  });
}

// Le plus long des deux blocages (par email, par IP) l'emporte.
const pire = (a: VerdictLimite, b: VerdictLimite): VerdictLimite =>
  !a.bloque ? b : !b.bloque ? a : a.minutesRestantes >= b.minutesRestantes ? a : b;

export async function verifierConnexion(email: string, entetes: Headers): Promise<VerdictLimite> {
  const [parEmail, parIp] = await Promise.all([
    verifier("CONNEXION_ECHEC", cleEmail(email), LIMITES.connexionEmail),
    verifier("CONNEXION_ECHEC", cleIp(entetes), LIMITES.connexionIp),
  ]);
  return pire(parEmail, parIp);
}

export async function enregistrerEchecConnexion(email: string, entetes: Headers): Promise<void> {
  await enregistrer("CONNEXION_ECHEC", [cleEmail(email), cleIp(entetes)]);
}

// Une connexion réussie remet à zéro le compteur de l'email (pas celui de l'IP).
export async function effacerEchecsConnexion(email: string): Promise<void> {
  await prisma.tentativeAcces.deleteMany({
    where: { type: "CONNEXION_ECHEC", cle: cleEmail(email) },
  });
}

export function verifierInscription(entetes: Headers): Promise<VerdictLimite> {
  return verifier("INSCRIPTION", cleIp(entetes), LIMITES.inscriptionIp);
}

export async function enregistrerInscription(entetes: Headers): Promise<void> {
  await enregistrer("INSCRIPTION", [cleIp(entetes)]);
}
