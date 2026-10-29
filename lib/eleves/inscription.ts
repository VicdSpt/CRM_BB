import { z } from "zod";
import type { StatutCompte } from "@prisma/client";
import { messageMotDePasseFaible } from "@/lib/auth/force-mot-de-passe";

const texteObligatoire = (message: string) => z.string().trim().min(1, message);

export const inscriptionSchema = z
  .object({
    prenom: texteObligatoire("Le prénom est obligatoire"),
    nom: texteObligatoire("Le nom est obligatoire"),
    email: z.string().trim().toLowerCase().email("Email invalide"),
    telephone: texteObligatoire("Le téléphone est obligatoire"),
    // Minuscule, majuscule, chiffre, symbole et 8 caractères : vérifié ici, côté serveur,
    // même si la page l'affiche déjà en direct.
    motDePasse: z.string().superRefine((mdp, ctx) => {
      const message = messageMotDePasseFaible(mdp);
      if (message) ctx.addIssue({ code: "custom", message });
    }),
    confirmation: z.string(),
  })
  .refine((v) => v.confirmation === v.motDePasse, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmation"],
  })
  // La confirmation ne sert qu'à la vérification : elle ne sort pas du schéma.
  .transform(({ prenom, nom, email, telephone, motDePasse }) => ({
    prenom,
    nom,
    email,
    telephone,
    motDePasse,
  }));

export type InscriptionInput = z.infer<typeof inscriptionSchema>;

export type ParseResult =
  | { success: true; data: InscriptionInput }
  | { success: false; errors: Record<string, string> };

export function parseInscriptionForm(formData: FormData): ParseResult {
  const champ = (nom: string) => String(formData.get(nom) ?? "");
  const parsed = inscriptionSchema.safeParse({
    prenom: champ("prenom"),
    nom: champ("nom"),
    email: champ("email"),
    telephone: champ("telephone"),
    motDePasse: champ("motDePasse"),
    confirmation: champ("confirmation"),
  });
  if (parsed.success) return { success: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

type Identite = { prenom: string | null; nom: string | null; telephone: string | null };
export type EcartIdentite = { champ: string; fiche: string; saisie: string };

const normaliser = (v: string) => v.toLowerCase().replace(/\s+/g, "");

// Lors d'un rattachement, compare l'identité saisie à la fiche existante pour que le
// coach repère une usurpation (quelqu'un qui s'inscrit avec l'email d'un autre élève).
export function ecartsIdentite(fiche: Identite, saisie: Identite): EcartIdentite[] {
  const champs = [
    ["Prénom", fiche.prenom, saisie.prenom],
    ["Nom", fiche.nom, saisie.nom],
    ["Téléphone", fiche.telephone, saisie.telephone],
  ] as const;
  return champs
    .filter(([, f, s]) => s !== null && normaliser(f ?? "") !== normaliser(s))
    .map(([champ, f, s]) => ({ champ, fiche: f ?? "—", saisie: s as string }));
}

export type DecisionInscription =
  | { type: "creer" }
  | { type: "rattacher"; eleveId: string }
  | { type: "refus"; message: string };

const COMPTE_EXISTANT = "Un compte existe déjà avec cet email.";

// Une fiche créée par le coach (sans compte) est réutilisée plutôt que dupliquée ;
// le coach valide de toute façon chaque inscription.
export function decideInscription(
  existant: { id: string; statutCompte: StatutCompte; archive?: boolean } | null,
  emailEstCoach: boolean,
): DecisionInscription {
  if (emailEstCoach) return { type: "refus", message: COMPTE_EXISTANT };
  if (!existant) return { type: "creer" };
  // Une fiche archivée ne peut pas se connecter : la rattacher créerait un compte inutilisable.
  if (existant.archive) {
    return { type: "refus", message: "Ce compte n'est plus actif. Contacte ton coach." };
  }
  if (existant.statutCompte === "AUCUN") return { type: "rattacher", eleveId: existant.id };
  return { type: "refus", message: COMPTE_EXISTANT };
}
