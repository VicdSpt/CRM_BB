import type { StatutReglement, StatutSeance } from "@prisma/client";

// Délai minimum avant le cours pour se désinscrire soi-même (à ajuster avec le coach).
export const DELAI_DESINSCRIPTION_HEURES = 24;
// Horizon du calendrier élève.
export const HORIZON_JOURS = 28;

export type Cours = {
  statut: StatutSeance;
  debut: Date;
  nbInscrits: number;
  capacite: number;
  inscrit: boolean;
  statutReglement: StatutReglement | null;
};

export type EtatCours =
  | "annule"
  | "inscrit"
  | "inscrit_verrouille"
  | "complet"
  | "disponible"
  | "passe";

export type Verdict = { ok: true } | { ok: false; raison: string };

const HEURE_MS = 3_600_000;

export function placesRestantes(nbInscrits: number, capacite: number): number {
  return Math.max(0, capacite - nbInscrits);
}

const commence = (c: Cours, now: Date) => c.debut.getTime() <= now.getTime();
const dansLeDelai = (c: Cours, now: Date) =>
  c.debut.getTime() - now.getTime() < DELAI_DESINSCRIPTION_HEURES * HEURE_MS;

export function etatCours(c: Cours, now: Date): EtatCours {
  if (c.statut === "ANNULEE") return "annule";
  if (commence(c, now)) return "passe";
  if (c.inscrit) return dansLeDelai(c, now) ? "inscrit_verrouille" : "inscrit";
  return placesRestantes(c.nbInscrits, c.capacite) === 0 ? "complet" : "disponible";
}

export function peutSInscrire(c: Cours, now: Date): Verdict {
  if (c.statut === "ANNULEE") return { ok: false, raison: "Ce cours est annulé." };
  if (commence(c, now)) return { ok: false, raison: "Ce cours a déjà commencé." };
  if (c.inscrit) return { ok: false, raison: "Tu es déjà inscrit à ce cours." };
  if (placesRestantes(c.nbInscrits, c.capacite) === 0) {
    return { ok: false, raison: "Ce cours est complet." };
  }
  return { ok: true };
}

export function peutSeDesinscrire(c: Cours, now: Date): Verdict {
  if (dansLeDelai(c, now)) {
    return {
      ok: false,
      raison: `Désinscription impossible à moins de ${DELAI_DESINSCRIPTION_HEURES} h du cours. Contacte ton coach.`,
    };
  }
  if (c.statutReglement !== "A_REGLER") {
    return { ok: false, raison: "Ce cours est déjà réglé. Contacte ton coach." };
  }
  return { ok: true };
}
