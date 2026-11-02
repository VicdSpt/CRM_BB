import { describe, it, expect } from "vitest";
import { copiesParCote, HEURES_ROUE, indexAuCentre, indexRecentre, minutesRoue } from "./roue";

describe("valeurs de la roue", () => {
  it("propose les heures de 00 à 23", () => {
    expect(HEURES_ROUE).toHaveLength(24);
    expect(HEURES_ROUE[0]).toBe("00");
    expect(HEURES_ROUE.at(-1)).toBe("23");
  });

  it("propose les minutes de 5 en 5", () => {
    expect(minutesRoue()).toEqual([
      "00",
      "05",
      "10",
      "15",
      "20",
      "25",
      "30",
      "35",
      "40",
      "45",
      "50",
      "55",
    ]);
  });

  it("garde une minute hors pas d'une séance existante, à sa place", () => {
    expect(minutesRoue("47").slice(9, 12)).toEqual(["45", "47", "50"]);
    expect(minutesRoue("45")).toHaveLength(12);
  });
});

describe("indexAuCentre", () => {
  it("prend l'élément le plus proche du centre après défilement", () => {
    expect(indexAuCentre(0, 40, 24)).toBe(0);
    expect(indexAuCentre(58, 40, 24)).toBe(1);
    expect(indexAuCentre(61, 40, 24)).toBe(2);
  });

  it("reste dans les bornes (rebond du défilement sur mobile)", () => {
    expect(indexAuCentre(-30, 40, 24)).toBe(0);
    expect(indexAuCentre(5000, 40, 24)).toBe(23);
  });
});

describe("roue infinie", () => {
  it("répète assez les valeurs pour un grand coup de doigt (≈ 3 000 px de chaque côté)", () => {
    expect(copiesParCote(24) * 24 * 40).toBeGreaterThanOrEqual(3000);
    expect(copiesParCote(12) * 12 * 40).toBeGreaterThanOrEqual(2800);
  });

  it("ramène l'index dans la copie du milieu, sur la même valeur", () => {
    const n = 24;
    const cote = copiesParCote(n);
    const milieu = cote * n;
    expect(indexRecentre(milieu + 8, n, cote)).toBe(milieu + 8);
    expect(indexRecentre(8, n, cote)).toBe(milieu + 8); // tout en haut
    expect(indexRecentre(milieu + n + 3, n, cote)).toBe(milieu + 3); // après 23 → 00, 01, 02, 03
    expect(indexRecentre(milieu - 1, n, cote)).toBe(milieu + n - 1); // avant 00 → 23
  });
});
