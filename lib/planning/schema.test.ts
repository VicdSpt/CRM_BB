import { describe, it, expect } from "vitest";
import { seanceSchema, parseSeanceForm } from "./schema";

function fd(entries: Array<[string, string]>): FormData {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}

describe("seanceSchema", () => {
  const base = {
    type: "COLLECTIF" as const,
    dateHeureDebut: new Date(2026, 5, 20, 18, 0),
    dureeMinutes: 60,
    prixReference: 15,
    eleveIds: ["e1", "e2"],
  };

  it("accepte une séance collective valide", () => {
    expect(seanceSchema.safeParse(base).success).toBe(true);
  });

  it("rejette une durée nulle ou négative", () => {
    expect(seanceSchema.safeParse({ ...base, dureeMinutes: 0 }).success).toBe(false);
  });

  it("rejette un prix négatif", () => {
    expect(seanceSchema.safeParse({ ...base, prixReference: -5 }).success).toBe(false);
  });

  it("rejette une séance sans élève", () => {
    expect(seanceSchema.safeParse({ ...base, eleveIds: [] }).success).toBe(false);
  });

  it("rejette un cours privé avec 2 élèves", () => {
    expect(seanceSchema.safeParse({ ...base, type: "PRIVE", eleveIds: ["e1", "e2"] }).success).toBe(
      false,
    );
  });

  it("accepte un cours privé avec exactement 1 élève", () => {
    expect(seanceSchema.safeParse({ ...base, type: "PRIVE", eleveIds: ["e1"] }).success).toBe(true);
  });
});

describe("parseSeanceForm", () => {
  it("valide un FormData correct (plusieurs eleveIds)", () => {
    const res = parseSeanceForm(
      fd([
        ["type", "COLLECTIF"],
        ["dateHeureDebut", "2026-06-20T18:00"],
        ["dureeMinutes", "60"],
        ["lieu", "Salle A"],
        ["prixReference", "15"],
        ["eleveIds", "e1"],
        ["eleveIds", "e2"],
      ]),
    );
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.eleveIds).toEqual(["e1", "e2"]);
      expect(res.data.type).toBe("COLLECTIF");
      expect(res.data.dureeMinutes).toBe(60);
    }
  });

  it("renvoie une erreur si aucun élève sélectionné", () => {
    const res = parseSeanceForm(
      fd([
        ["type", "COLLECTIF"],
        ["dateHeureDebut", "2026-06-20T18:00"],
        ["dureeMinutes", "60"],
        ["prixReference", "15"],
      ]),
    );
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.eleveIds).toBeTruthy();
  });
});
