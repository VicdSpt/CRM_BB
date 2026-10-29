// Règles de mot de passe des comptes élèves. Utilisées à la fois par le serveur
// (refus à l'inscription) et par la page (jauge et cases cochées en direct).

export const LONGUEUR_MIN_MOT_DE_PASSE = 8;

export type ReglesMotDePasse = {
  longueur: boolean;
  minuscule: boolean;
  majuscule: boolean;
  chiffre: boolean;
  symbole: boolean;
};

// Libellés dans l'ordre d'affichage, réutilisés par la liste de la page.
export const LIBELLES_REGLES: Record<keyof ReglesMotDePasse, string> = {
  longueur: `au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères`,
  minuscule: "une minuscule",
  majuscule: "une majuscule",
  chiffre: "un chiffre",
  symbole: "un symbole",
};

export function reglesMotDePasse(mdp: string): ReglesMotDePasse {
  return {
    longueur: [...mdp].length >= LONGUEUR_MIN_MOT_DE_PASSE,
    // \p{…} : les lettres accentuées comptent comme des lettres.
    minuscule: /\p{Ll}/u.test(mdp),
    majuscule: /\p{Lu}/u.test(mdp),
    chiffre: /\p{Nd}/u.test(mdp),
    symbole: /[^\p{L}\p{N}\s]/u.test(mdp),
  };
}

// 0 = vide, 1 = faible, 2 = moyen, 3 = bon, 4 = fort.
export function forceMotDePasse(mdp: string): 0 | 1 | 2 | 3 | 4 {
  if (mdp.length === 0) return 0;
  const respectees = Object.values(reglesMotDePasse(mdp)).filter(Boolean).length;
  if (respectees <= 2) return 1;
  if (respectees === 3) return 2;
  if (respectees === 4) return 3;
  return 4;
}

const enumerer = (items: string[]) =>
  items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;

// Message d'erreur listant ce qui manque, ou null si le mot de passe est conforme.
export function messageMotDePasseFaible(mdp: string): string | null {
  const regles = reglesMotDePasse(mdp);
  const manques = (Object.keys(LIBELLES_REGLES) as (keyof ReglesMotDePasse)[])
    .filter((r) => !regles[r])
    .map((r) => LIBELLES_REGLES[r]);
  return manques.length === 0 ? null : `Mot de passe trop faible : il manque ${enumerer(manques)}.`;
}
