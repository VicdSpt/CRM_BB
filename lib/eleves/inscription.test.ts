import { describe, it, expect } from "vitest";
import { decideInscription, ecartsIdentite, parseInscriptionForm } from "./inscription";

describe("ecartsIdentite", () => {
  const fiche = { prenom: "Sam", nom: "Dupont", telephone: "0470 12 34 56" };

  it("ne signale rien quand l'identité saisie correspond (casse et espaces ignorés)", () => {
    expect(
      ecartsIdentite(fiche, { prenom: " sam ", nom: "DUPONT", telephone: "0470123456" }),
    ).toEqual([]);
  });

  it("signale chaque champ qui diffère de la fiche existante", () => {
    expect(
      ecartsIdentite(fiche, { prenom: "Alex", nom: "Dupont", telephone: "0499 00 00 00" }),
    ).toEqual([
      { champ: "Prénom", fiche: "Sam", saisie: "Alex" },
      { champ: "Téléphone", fiche: "0470 12 34 56", saisie: "0499 00 00 00" },
    ]);
  });

  it("ignore un champ non saisi", () => {
    expect(ecartsIdentite(fiche, { prenom: null, nom: null, telephone: null })).toEqual([]);
  });
});

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

const valide = {
  prenom: "Sam",
  nom: "Dupont",
  email: "sam@exemple.be",
  telephone: "0470 12 34 56",
  motDePasse: "motdepasse",
};

describe("decideInscription", () => {
  it("crée une fiche quand l'email est inconnu", () => {
    expect(decideInscription(null, false)).toEqual({ type: "creer" });
  });

  it("se rattache à une fiche existante sans compte", () => {
    expect(decideInscription({ id: "e1", statutCompte: "AUCUN" }, false)).toEqual({
      type: "rattacher",
      eleveId: "e1",
    });
  });

  it("refuse si un compte existe déjà (en attente ou validé)", () => {
    const refus = { type: "refus", message: "Un compte existe déjà avec cet email." };
    expect(decideInscription({ id: "e1", statutCompte: "EN_ATTENTE" }, false)).toEqual(refus);
    expect(decideInscription({ id: "e1", statutCompte: "VALIDE" }, false)).toEqual(refus);
  });

  it("refuse l'email du coach", () => {
    expect(decideInscription(null, true)).toEqual({
      type: "refus",
      message: "Un compte existe déjà avec cet email.",
    });
  });
});

describe("parseInscriptionForm", () => {
  it("accepte une inscription complète", () => {
    expect(parseInscriptionForm(fd(valide)).success).toBe(true);
  });

  it("exige 8 caractères minimum pour le mot de passe", () => {
    const res = parseInscriptionForm(fd({ ...valide, motDePasse: "7caract" }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.motDePasse).toBe("8 caractères minimum");
  });

  it("exige un téléphone", () => {
    const res = parseInscriptionForm(fd({ ...valide, telephone: "  " }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.telephone).toBe("Le téléphone est obligatoire");
  });

  it("met l'email en minuscules", () => {
    const res = parseInscriptionForm(fd({ ...valide, email: " Sam@Exemple.be " }));
    expect(res.success && res.data.email).toBe("sam@exemple.be");
  });
});
