import { describe, it, expect } from "vitest";
import { decisionConnexionGoogle, MESSAGES_ERREUR_GOOGLE } from "./connexion-google";

const eleve = (overrides = {}) => ({
  id: "e1",
  prenom: "Sam",
  nom: "Dupont",
  statutCompte: "VALIDE" as const,
  archive: false,
  ...overrides,
});

describe("decisionConnexionGoogle", () => {
  it("connecte un élève dont le compte existe", () => {
    expect(
      decisionConnexionGoogle({ emailVerifie: true, emailEstCoach: false, eleve: eleve() }),
    ).toEqual({ ok: true, eleveId: "e1", nom: "Sam Dupont" });
  });

  it("connecte aussi un compte en attente (il verra la page d'attente)", () => {
    const d = decisionConnexionGoogle({
      emailVerifie: true,
      emailEstCoach: false,
      eleve: eleve({ statutCompte: "EN_ATTENTE" }),
    });
    expect(d.ok).toBe(true);
  });

  it("refuse un email que Google n'a pas vérifié", () => {
    expect(
      decisionConnexionGoogle({ emailVerifie: false, emailEstCoach: false, eleve: eleve() }),
    ).toEqual({ ok: false, erreur: "email-non-verifie" });
  });

  it("refuse le compte coach (il se connecte avec son mot de passe)", () => {
    expect(
      decisionConnexionGoogle({ emailVerifie: true, emailEstCoach: true, eleve: null }),
    ).toEqual({ ok: false, erreur: "compte-coach" });
  });

  it("refuse un email sans compte : Google ne crée pas de compte", () => {
    expect(
      decisionConnexionGoogle({ emailVerifie: true, emailEstCoach: false, eleve: null }),
    ).toEqual({ ok: false, erreur: "compte-inconnu" });
    expect(
      decisionConnexionGoogle({
        emailVerifie: true,
        emailEstCoach: false,
        eleve: eleve({ statutCompte: "AUCUN" }),
      }),
    ).toEqual({ ok: false, erreur: "compte-inconnu" });
  });

  it("refuse un compte archivé", () => {
    expect(
      decisionConnexionGoogle({
        emailVerifie: true,
        emailEstCoach: false,
        eleve: eleve({ archive: true }),
      }),
    ).toEqual({ ok: false, erreur: "compte-inactif" });
  });
});

describe("MESSAGES_ERREUR_GOOGLE", () => {
  it("explique à l'élève quoi faire quand son email est inconnu", () => {
    expect(MESSAGES_ERREUR_GOOGLE["compte-inconnu"]).toBe(
      "Aucun compte avec cet email. Crée d'abord ton compte.",
    );
  });
});
