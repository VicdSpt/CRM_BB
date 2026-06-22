import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { granulariteParPeriode, genererBuckets, agregerParBucket } from "./evolution";

describe("granulariteParPeriode", () => {
  it("mappe période → granularité", () => {
    expect(granulariteParPeriode("jour")).toBe("heure");
    expect(granulariteParPeriode("semaine")).toBe("jour");
    expect(granulariteParPeriode("mois")).toBe("jour");
    expect(granulariteParPeriode("annee")).toBe("mois");
  });
});

describe("genererBuckets", () => {
  it("génère 24 intervalles horaires sur une journée", () => {
    const debut = new Date(2026, 5, 20, 0, 0, 0, 0);
    const fin = new Date(2026, 5, 20, 23, 59, 59, 999);
    const b = genererBuckets(debut, fin, "heure");
    expect(b).toHaveLength(24);
    expect(b[0].label).toBe("0h");
    expect(b[14].label).toBe("14h");
  });

  it("génère un intervalle par jour sur une semaine", () => {
    const debut = new Date(2026, 5, 15, 0, 0, 0, 0); // lundi
    const fin = new Date(2026, 5, 21, 23, 59, 59, 999); // dimanche
    const b = genererBuckets(debut, fin, "jour");
    expect(b).toHaveLength(7);
    expect(b[0].label).toBe("15");
    expect(b[6].label).toBe("21");
    // labelLong : libellé complet (avec le mois) pour le tooltip
    expect(b[0].labelLong).toBe("15 juin");
    expect(b[6].labelLong).toBe("21 juin");
  });

  it("génère un intervalle par mois sur une année", () => {
    const debut = new Date(2026, 0, 1, 0, 0, 0, 0);
    const fin = new Date(2026, 11, 31, 23, 59, 59, 999);
    const b = genererBuckets(debut, fin, "mois");
    expect(b).toHaveLength(12);
  });
});

describe("agregerParBucket", () => {
  it("somme les montants dans le bon intervalle (Decimal exact)", () => {
    const debut = new Date(2026, 5, 15, 0, 0, 0, 0);
    const fin = new Date(2026, 5, 17, 23, 59, 59, 999);
    const buckets = genererBuckets(debut, fin, "jour"); // 15, 16, 17
    const paiements = [
      { date: new Date(2026, 5, 15, 10, 0), montant: new Prisma.Decimal("15.50") },
      { date: new Date(2026, 5, 15, 18, 0), montant: new Prisma.Decimal("4.50") },
      { date: new Date(2026, 5, 17, 9, 0), montant: new Prisma.Decimal("30") },
    ];
    const r = agregerParBucket(paiements, buckets);
    expect(r[0].total.toString()).toBe("20"); // 15.50 + 4.50
    expect(r[1].total.toString()).toBe("0"); // 16 juin
    expect(r[2].total.toString()).toBe("30");
  });
});
