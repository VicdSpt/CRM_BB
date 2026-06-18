import { describe, it, expect } from "vitest";
import { eleveSchema, parseEleveForm } from "./schema";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("eleveSchema", () => {
  it("exige prénom et nom", () => {
    expect(eleveSchema.safeParse({ prenom: "", nom: "" }).success).toBe(false);
  });

  it("accepte un élève minimal (prénom + nom)", () => {
    const r = eleveSchema.safeParse({ prenom: "Jean", nom: "Dupont" });
    expect(r.success).toBe(true);
  });

  it("rejette un email mal formé", () => {
    expect(
      eleveSchema.safeParse({ prenom: "Jean", nom: "Dupont", email: "pas-un-email" }).success,
    ).toBe(false);
  });

  it("transforme une chaîne vide optionnelle en undefined", () => {
    const r = eleveSchema.parse({ prenom: "Jean", nom: "Dupont", telephone: "", email: "" });
    expect(r.telephone).toBeUndefined();
    expect(r.email).toBeUndefined();
  });
});

describe("parseEleveForm", () => {
  it("valide un FormData correct", () => {
    const res = parseEleveForm(fd({ prenom: "Jean", nom: "Dupont", telephone: "0600000000" }));
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.prenom).toBe("Jean");
      expect(res.data.telephone).toBe("0600000000");
    }
  });

  it("renvoie des erreurs si prénom/nom manquent", () => {
    const res = parseEleveForm(fd({ prenom: "", nom: "" }));
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.prenom).toBeTruthy();
      expect(res.errors.nom).toBeTruthy();
    }
  });
});
