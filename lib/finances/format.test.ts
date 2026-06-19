import { describe, it, expect } from "vitest";
import { formatEuros } from "./format";

describe("formatEuros", () => {
  it("formate un entier", () => {
    expect(formatEuros(15)).toBe("15,00 €");
  });

  it("formate une chaîne décimale (sortie Prisma Decimal)", () => {
    expect(formatEuros("15.5")).toBe("15,50 €");
  });

  it("formate zéro", () => {
    expect(formatEuros("0")).toBe("0,00 €");
  });
});
