import { describe, it, expect } from "vitest";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, rangePeriode } from "./periode";

describe("helpers de période", () => {
  it("startOfMonth = 1er du mois 00:00", () => {
    const r = startOfMonth(new Date(2026, 5, 20, 14, 0));
    expect([r.getDate(), r.getMonth(), r.getHours()]).toEqual([1, 5, 0]);
  });

  it("endOfMonth = dernier jour 23:59 (juin = 30)", () => {
    const r = endOfMonth(new Date(2026, 5, 20));
    expect([r.getDate(), r.getMonth(), r.getHours(), r.getMinutes()]).toEqual([30, 5, 23, 59]);
  });

  it("endOfMonth gère février (2026 = 28 jours)", () => {
    const r = endOfMonth(new Date(2026, 1, 10));
    expect(r.getDate()).toBe(28);
  });

  it("startOfYear = 1er janvier", () => {
    const r = startOfYear(new Date(2026, 5, 20));
    expect([r.getDate(), r.getMonth()]).toEqual([1, 0]);
  });

  it("endOfYear = 31 décembre 23:59", () => {
    const r = endOfYear(new Date(2026, 5, 20));
    expect([r.getDate(), r.getMonth(), r.getHours()]).toEqual([31, 11, 23]);
  });

  it("rangePeriode mois renvoie début/fin du mois", () => {
    const { debut, fin } = rangePeriode("mois", new Date(2026, 5, 20));
    expect(debut.getDate()).toBe(1);
    expect(fin.getDate()).toBe(30);
  });

  it("rangePeriode jour renvoie le même jour", () => {
    const { debut, fin } = rangePeriode("jour", new Date(2026, 5, 20, 15));
    expect(debut.getDate()).toBe(20);
    expect(fin.getDate()).toBe(20);
    expect(debut.getHours()).toBe(0);
    expect(fin.getHours()).toBe(23);
  });
});
