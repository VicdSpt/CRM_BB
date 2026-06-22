import { describe, it, expect } from "vitest";
import { formatEuros } from "./format";

describe("formatEuros", () => {
  it("formate un entier sans décimales", () => {
    expect(formatEuros(15)).toBe("15 €");
  });

  it("formate une chaîne décimale avec ses centimes (sortie Prisma Decimal)", () => {
    expect(formatEuros("15.5")).toBe("15,50 €");
  });

  it("formate zéro sans décimales", () => {
    expect(formatEuros("0")).toBe("0 €");
  });
});
