import { describe, it, expect } from "vitest";
import { pourcentage } from "./pourcentage";

describe("pourcentage", () => {
  it("renvoie 0 si le total est nul", () => {
    expect(pourcentage(0, 0)).toBe(0);
    expect(pourcentage(10, 0)).toBe(0);
  });

  it("calcule un pourcentage entier", () => {
    expect(pourcentage(50, 100)).toBe(50);
    expect(pourcentage(1, 3)).toBe(33);
  });

  it("borne à 100", () => {
    expect(pourcentage(150, 100)).toBe(100);
  });
});
