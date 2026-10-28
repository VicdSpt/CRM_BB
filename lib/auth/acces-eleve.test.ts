import { describe, it, expect } from "vitest";
import { etatAccesEleve } from "./acces-eleve";

describe("etatAccesEleve", () => {
  it("considère inactif un élève introuvable", () => {
    expect(etatAccesEleve(null)).toBe("inactif");
  });

  it("considère inactif un élève sans compte (refusé)", () => {
    expect(etatAccesEleve({ statutCompte: "AUCUN", archive: false })).toBe("inactif");
  });

  it("considère inactif un élève validé mais archivé", () => {
    expect(etatAccesEleve({ statutCompte: "VALIDE", archive: true })).toBe("inactif");
  });

  it("met en attente un compte pas encore validé", () => {
    expect(etatAccesEleve({ statutCompte: "EN_ATTENTE", archive: false })).toBe("en_attente");
  });

  it("donne accès à un compte validé", () => {
    expect(etatAccesEleve({ statutCompte: "VALIDE", archive: false })).toBe("valide");
  });
});
