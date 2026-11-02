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
    prixReference: "15",
    eleveIds: ["e1", "e2"],
  };

  it("accepte une séance collective valide", () => {
    expect(seanceSchema.safeParse(base).success).toBe(true);
  });

  it("rejette une durée nulle ou négative", () => {
    expect(seanceSchema.safeParse({ ...base, dureeMinutes: 0 }).success).toBe(false);
  });

  it("rejette un prix négatif", () => {
    expect(seanceSchema.safeParse({ ...base, prixReference: "-5" }).success).toBe(false);
  });

  it("accepte un cours collectif sans élève (les élèves s'inscrivent eux-mêmes)", () => {
    expect(seanceSchema.safeParse({ ...base, eleveIds: [] }).success).toBe(true);
  });

  it("rejette un cours privé sans élève", () => {
    const res = seanceSchema.safeParse({ ...base, type: "PRIVE", eleveIds: [] });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Choisis l'élève du cours privé.");
    }
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
  it("ignore tout élève envoyé pour un cours collectif (les élèves réservent eux-mêmes)", () => {
    const res = parseSeanceForm(
      fd([
        ["type", "COLLECTIF"],
        ["dateHeureDebut", "2026-06-20T18:00"],
        ["dureeMinutes", "60"],
        ["lieu", "Salle A"],
        ["prixReference", "15"],
        ["eleveId", "e1"],
      ]),
    );
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.eleveIds).toEqual([]);
      expect(res.data.type).toBe("COLLECTIF");
      expect(res.data.dureeMinutes).toBe(60);
    }
  });

  it("prend l'élève choisi dans le menu pour un cours privé", () => {
    const res = parseSeanceForm(
      fd([
        ["type", "PRIVE"],
        ["dateHeureDebut", "2026-06-20T18:00"],
        ["dureeMinutes", "60"],
        ["prixReference", "15"],
        ["eleveId", "e1"],
      ]),
    );
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.eleveIds).toEqual(["e1"]);
  });

  it("renvoie une erreur si aucun élève sélectionné pour un cours privé", () => {
    const res = parseSeanceForm(
      fd([
        ["type", "PRIVE"],
        ["dateHeureDebut", "2026-06-20T18:00"],
        ["dureeMinutes", "60"],
        ["prixReference", "15"],
      ]),
    );
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.eleveIds).toBe("Choisis l'élève du cours privé.");
    }
  });

  const collectif = (capacite: string): Array<[string, string]> => [
    ["type", "COLLECTIF"],
    ["dateHeureDebut", "2026-06-20T18:00"],
    ["dureeMinutes", "60"],
    ["prixReference", "15"],
    ["capacite", capacite],
  ];

  it("met 4 places par défaut quand la capacité est vide", () => {
    const res = parseSeanceForm(fd(collectif("")));
    expect(res.success && res.data.capacite).toBe(4);
  });

  it("lit la capacité saisie", () => {
    const res = parseSeanceForm(fd(collectif("6")));
    expect(res.success && res.data.capacite).toBe(6);
  });

  it("rejette une capacité de 0", () => {
    const res = parseSeanceForm(fd(collectif("0")));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.capacite).toBe("Au moins 1 place");
  });
});

describe("répétition", () => {
  const champs = (repetition?: string): Array<[string, string]> => [
    ["type", "COLLECTIF"],
    ["dateHeureDebut", "2026-06-20T18:00"],
    ["dureeMinutes", "60"],
    ["prixReference", "15"],
    ...(repetition === undefined ? [] : ([["repetition", repetition]] as Array<[string, string]>)),
  ];

  it("vaut 1 (une seule séance) sans choix", () => {
    const res = parseSeanceForm(fd(champs()));
    expect(res.success && res.data.repetition).toBe(1);
  });

  it("accepte de 1 à 12 semaines", () => {
    const res = parseSeanceForm(fd(champs("8")));
    expect(res.success && res.data.repetition).toBe(8);
    expect(parseSeanceForm(fd(champs("13"))).success).toBe(false);
    expect(parseSeanceForm(fd(champs("0"))).success).toBe(false);
  });
});
