import type { StatutCompte } from "@prisma/client";

// Google sert uniquement à SE CONNECTER à un compte élève qui existe déjà (même email) :
// il ne crée jamais de compte, et le compte coach garde son mot de passe.

export type CodeErreurGoogle =
  | "email-non-verifie"
  | "compte-coach"
  | "compte-inconnu"
  | "compte-inactif";

export const MESSAGES_ERREUR_GOOGLE: Record<CodeErreurGoogle, string> = {
  "email-non-verifie": "Ton adresse Google n'est pas vérifiée. Connecte-toi avec ton mot de passe.",
  "compte-coach": "Le compte coach se connecte avec son email et son mot de passe.",
  "compte-inconnu": "Aucun compte avec cet email. Crée d'abord ton compte.",
  "compte-inactif": "Ton compte n'est pas actif. Contacte ton coach.",
};

export type DecisionGoogle =
  | { ok: true; eleveId: string; nom: string }
  | { ok: false; erreur: CodeErreurGoogle };

export function decisionConnexionGoogle(p: {
  emailVerifie: boolean;
  emailEstCoach: boolean;
  eleve: {
    id: string;
    prenom: string;
    nom: string;
    statutCompte: StatutCompte;
    archive: boolean;
  } | null;
}): DecisionGoogle {
  if (!p.emailVerifie) return { ok: false, erreur: "email-non-verifie" };
  if (p.emailEstCoach) return { ok: false, erreur: "compte-coach" };
  if (!p.eleve || p.eleve.statutCompte === "AUCUN") return { ok: false, erreur: "compte-inconnu" };
  if (p.eleve.archive) return { ok: false, erreur: "compte-inactif" };
  return { ok: true, eleveId: p.eleve.id, nom: `${p.eleve.prenom} ${p.eleve.nom}` };
}

export function estCodeErreurGoogle(v: unknown): v is CodeErreurGoogle {
  return typeof v === "string" && v in MESSAGES_ERREUR_GOOGLE;
}
