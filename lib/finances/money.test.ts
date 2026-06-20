import { describe, it, expect } from "vitest";
import { montantSchema, parseMontant } from "./money";

describe("montantSchema", () => {
  it("accepte un entier en chaîne", () => {
    expect(montantSchema.safeParse("350").success).toBe(true);
  });

  it("accepte une décimale à 2 chiffres", () => {
    expect(montantSchema.safeParse("15.50").success).toBe(true);
  });

  it("rejette plus de 2 décimales", () => {
    expect(montantSchema.safeParse("1.999").success).toBe(false);
  });

  it("rejette un négatif", () => {
    expect(montantSchema.safeParse("-5").success).toBe(false);
  });

  it("rejette une valeur non numérique", () => {
    expect(montantSchema.safeParse("abc").success).toBe(false);
  });
});

describe("parseMontant", () => {
  it("renvoie la chaîne validée", () => {
    const r = parseMontant("15.5");
    expect(r).toEqual({ ok: true, value: "15.5" });
  });

  it("renvoie une erreur pour une saisie invalide", () => {
    const r = parseMontant("");
    expect(r.ok).toBe(false);
  });
});
