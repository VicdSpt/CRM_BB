import { describe, it, expect } from "vitest";
import { libelleStatut, libelleType } from "./libelles";

describe("libelleStatut", () => {
  it("traduit les statuts", () => {
    expect(libelleStatut("PLANIFIEE")).toBe("Planifiée");
    expect(libelleStatut("REALISEE")).toBe("Réalisée");
    expect(libelleStatut("ANNULEE")).toBe("Annulée");
  });
});

describe("libelleType", () => {
  it("traduit les types", () => {
    expect(libelleType("PRIVE")).toBe("Privé");
    expect(libelleType("COLLECTIF")).toBe("Collectif");
  });
});
