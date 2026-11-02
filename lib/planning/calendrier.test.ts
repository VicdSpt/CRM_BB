import { describe, it, expect } from "vitest";
import { creneauxHoraires, grilleMois, libelleDateHeure, separerDateHeure } from "./calendrier";

describe("grilleMois", () => {
  it("commence la semaine le lundi et complète avec des cases vides", () => {
    // Novembre 2026 : le 1er est un dimanche.
    const g = grilleMois(2026, 10);
    expect(g[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(g[1]![0]).toBe("2026-11-02");
    expect(g.flat().filter(Boolean)).toHaveLength(30);
    expect(g.every((semaine) => semaine.length === 7)).toBe(true);
  });

  it("gère février d'une année bissextile", () => {
    expect(grilleMois(2028, 1).flat().filter(Boolean).at(-1)).toBe("2028-02-29");
  });
});

describe("creneauxHoraires", () => {
  it("propose un créneau toutes les 30 minutes, bornes comprises", () => {
    const c = creneauxHoraires("06:00", "08:00", 30);
    expect(c).toEqual(["06:00", "06:30", "07:00", "07:30", "08:00"]);
  });
});

describe("separerDateHeure", () => {
  it("découpe la valeur datetime-local", () => {
    expect(separerDateHeure("2026-11-10T18:30")).toEqual({ date: "2026-11-10", heure: "18:30" });
  });

  it("renvoie des valeurs vides sans valeur initiale", () => {
    expect(separerDateHeure(undefined)).toEqual({ date: null, heure: null });
  });
});

describe("libelleDateHeure", () => {
  it("écrit la date en français avec l'heure", () => {
    expect(libelleDateHeure("2026-11-10", "18:30")).toBe("Mardi 10 novembre 2026 à 18:30");
  });

  it("se contente de la date tant que l'heure manque", () => {
    expect(libelleDateHeure("2026-11-10", null)).toBe("Mardi 10 novembre 2026");
  });
});
