import { describe, it, expect } from "vitest";
import { prochaineSeance } from "./accueil";

const s = (h: number) => ({ id: `${h}h`, dateHeureDebut: new Date(2026, 5, 20, h, 0) });

describe("prochaineSeance", () => {
  const maintenant = new Date(2026, 5, 20, 12, 0);

  it("renvoie null si la liste est vide", () => {
    expect(prochaineSeance([], maintenant)).toBeNull();
  });

  it("renvoie null si toutes les séances sont passées", () => {
    expect(prochaineSeance([s(8), s(10)], maintenant)).toBeNull();
  });

  it("renvoie la première séance à venir", () => {
    const r = prochaineSeance([s(8), s(14), s(18)], maintenant);
    expect(r?.id).toBe("14h");
  });

  it("inclut une séance pile à l'heure courante (>=)", () => {
    const r = prochaineSeance([s(10), s(12), s(15)], maintenant);
    expect(r?.id).toBe("12h");
  });
});
