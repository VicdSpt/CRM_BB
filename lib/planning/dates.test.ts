import { describe, it, expect } from "vitest";
import {
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfWeek,
  datesRepetees,
} from "./dates";

describe("helpers de dates", () => {
  it("startOfDay met l'heure à 00:00:00.000", () => {
    const r = startOfDay(new Date(2026, 5, 20, 14, 30, 15, 500));
    expect([r.getHours(), r.getMinutes(), r.getSeconds(), r.getMilliseconds()]).toEqual([
      0, 0, 0, 0,
    ]);
    expect(r.getDate()).toBe(20);
  });

  it("endOfDay met l'heure à 23:59:59.999", () => {
    const r = endOfDay(new Date(2026, 5, 20, 1, 0, 0, 0));
    expect([r.getHours(), r.getMinutes(), r.getSeconds(), r.getMilliseconds()]).toEqual([
      23, 59, 59, 999,
    ]);
  });

  it("addDays ajoute des jours", () => {
    const r = addDays(new Date(2026, 5, 20), 5);
    expect(r.getDate()).toBe(25);
  });

  it("startOfWeek renvoie le lundi 00:00 (samedi 2026-06-20 -> lundi 2026-06-15)", () => {
    const r = startOfWeek(new Date(2026, 5, 20)); // 20 juin 2026 = samedi
    expect(r.getFullYear()).toBe(2026);
    expect(r.getMonth()).toBe(5);
    expect(r.getDate()).toBe(15); // lundi
    expect(r.getHours()).toBe(0);
  });

  it("startOfWeek pour un lundi renvoie le même jour", () => {
    const r = startOfWeek(new Date(2026, 5, 15)); // lundi
    expect(r.getDate()).toBe(15);
  });

  it("startOfWeek pour un dimanche renvoie le lundi précédent", () => {
    const r = startOfWeek(new Date(2026, 5, 21)); // dimanche
    expect(r.getDate()).toBe(15);
  });

  it("endOfWeek renvoie le dimanche 23:59:59.999", () => {
    const r = endOfWeek(new Date(2026, 5, 20));
    expect(r.getDate()).toBe(21); // dimanche
    expect(r.getHours()).toBe(23);
    expect(r.getMinutes()).toBe(59);
  });

  it("eachDayOfWeek renvoie 7 jours du lundi au dimanche", () => {
    const days = eachDayOfWeek(new Date(2026, 5, 20));
    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(15); // lundi
    expect(days[6].getDate()).toBe(21); // dimanche
  });
});

describe("datesRepetees", () => {
  it("répète la séance chaque semaine, à la même heure locale", () => {
    // Fin de l'heure d'été le 25 octobre 2026 : 18:00 reste 18:00.
    const dates = datesRepetees(new Date(2026, 9, 20, 18, 0), 3);
    expect(dates.map((d) => [d.getDate(), d.getMonth(), d.getHours(), d.getMinutes()])).toEqual([
      [20, 9, 18, 0],
      [27, 9, 18, 0],
      [3, 10, 18, 0],
    ]);
  });

  it("ne renvoie que la date de départ sans répétition", () => {
    const debut = new Date(2026, 10, 10, 9, 30);
    expect(datesRepetees(debut, 1)).toEqual([debut]);
  });
});
