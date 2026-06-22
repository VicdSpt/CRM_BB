import { describe, it, expect } from "vitest";
import { formatPlageSemaine } from "./format";

describe("formatPlageSemaine", () => {
  it("affiche une plage dans le même mois sans répéter le mois", () => {
    const debut = new Date(2026, 5, 15); // 15 juin
    const fin = new Date(2026, 5, 21); // 21 juin
    expect(formatPlageSemaine(debut, fin)).toBe("du 15 au 21 juin");
  });

  it("affiche le mois des deux côtés quand la semaine chevauche deux mois", () => {
    const debut = new Date(2026, 5, 29); // 29 juin
    const fin = new Date(2026, 6, 5); // 5 juillet
    expect(formatPlageSemaine(debut, fin)).toBe("du 29 juin au 5 juillet");
  });
});
