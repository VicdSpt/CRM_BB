import { describe, it, expect } from "vitest";
import { repartirCours } from "./historique";

const now = new Date(2026, 10, 10, 12, 0);
const le = (jour: number, heure = 18) => new Date(2026, 10, jour, heure, 0);

describe("repartirCours", () => {
  const cours = [
    { id: "passe-ancien", debut: le(1) },
    { id: "futur-loin", debut: le(20) },
    { id: "passe-recent", debut: le(9) },
    { id: "futur-proche", debut: le(11) },
  ];

  it("met les cours à venir du plus proche au plus lointain", () => {
    expect(repartirCours(cours, now).aVenir.map((c) => c.id)).toEqual([
      "futur-proche",
      "futur-loin",
    ]);
  });

  it("met les cours passés du plus récent au plus ancien", () => {
    expect(repartirCours(cours, now).passes.map((c) => c.id)).toEqual([
      "passe-recent",
      "passe-ancien",
    ]);
  });

  it("classe un cours déjà commencé dans les cours passés", () => {
    const enCours = { id: "maintenant", debut: now };
    expect(repartirCours([enCours], now).passes.map((c) => c.id)).toEqual(["maintenant"]);
  });
});
