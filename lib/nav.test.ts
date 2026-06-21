import { describe, it, expect } from "vitest";
import { isActive } from "./nav";

describe("isActive", () => {
  it("accueil actif uniquement sur la racine exacte", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/planning", "/")).toBe(false);
  });

  it("section active sur l'URL exacte", () => {
    expect(isActive("/eleves", "/eleves")).toBe(true);
  });

  it("section active sur une sous-page", () => {
    expect(isActive("/eleves/123", "/eleves")).toBe(true);
    expect(isActive("/eleves/123/modifier", "/eleves")).toBe(true);
  });

  it("section inactive pour une autre section", () => {
    expect(isActive("/planning", "/eleves")).toBe(false);
  });
});
