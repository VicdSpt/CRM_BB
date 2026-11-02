import { describe, it, expect } from "vitest";
import { parseInfosCoach, verifierNouveauMotDePasse } from "./profil";

const fd = (entries: Array<[string, string]>) => {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
};

describe("parseInfosCoach", () => {
  it("nettoie le nom et met l'email en minuscules", () => {
    const res = parseInfosCoach(
      fd([
        ["nom", "  Sam Boxe "],
        ["email", " Coach@Exemple.BE "],
      ]),
    );
    expect(res).toEqual({ success: true, data: { nom: "Sam Boxe", email: "coach@exemple.be" } });
  });

  it("refuse un nom vide et un email invalide", () => {
    const res = parseInfosCoach(
      fd([
        ["nom", " "],
        ["email", "pas-un-email"],
      ]),
    );
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.nom).toBe("Le nom est obligatoire.");
      expect(res.errors.email).toBe("Email invalide.");
    }
  });
});

describe("verifierNouveauMotDePasse", () => {
  const fort = "Boxe2026!";

  it("accepte un mot de passe fort, confirmé et différent de l'actuel", () => {
    expect(
      verifierNouveauMotDePasse({ actuel: "Ancien1!", nouveau: fort, confirmation: fort }),
    ).toBeNull();
  });

  it("exige le mot de passe actuel", () => {
    expect(verifierNouveauMotDePasse({ actuel: "", nouveau: fort, confirmation: fort })).toEqual({
      actuel: "Indique ton mot de passe actuel.",
    });
  });

  it("applique les mêmes règles fortes que pour les élèves", () => {
    const erreurs = verifierNouveauMotDePasse({
      actuel: "x",
      nouveau: "court",
      confirmation: "court",
    });
    expect(erreurs?.nouveau).toMatch(/^Mot de passe trop faible/);
  });

  it("refuse une confirmation différente", () => {
    expect(
      verifierNouveauMotDePasse({ actuel: "x", nouveau: fort, confirmation: "Boxe2026?" }),
    ).toEqual({ confirmation: "Les deux mots de passe ne correspondent pas." });
  });

  it("refuse de garder le même mot de passe", () => {
    expect(verifierNouveauMotDePasse({ actuel: fort, nouveau: fort, confirmation: fort })).toEqual({
      nouveau: "Choisis un mot de passe différent de l'actuel.",
    });
  });
});
