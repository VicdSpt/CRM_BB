import { Prisma } from "@prisma/client";
import { startOfDay, endOfDay, addDays } from "@/lib/planning/dates";
import { startOfMonth, endOfMonth } from "@/lib/finances/periode";

export type Granularite = "heure" | "jour" | "mois";
export type Bucket = { debut: Date; fin: Date; label: string };

export function granulariteParPeriode(periode: "jour" | "semaine" | "mois" | "annee"): Granularite {
  if (periode === "jour") return "heure";
  if (periode === "annee") return "mois";
  return "jour";
}

export function genererBuckets(debut: Date, fin: Date, granularite: Granularite): Bucket[] {
  const buckets: Bucket[] = [];

  if (granularite === "heure") {
    const start = new Date(
      debut.getFullYear(),
      debut.getMonth(),
      debut.getDate(),
      debut.getHours(),
      0,
      0,
      0,
    );
    for (let t = start; t <= fin; t = new Date(t.getTime() + 3_600_000)) {
      buckets.push({
        debut: new Date(t),
        fin: new Date(t.getTime() + 3_600_000 - 1),
        label: `${t.getHours()}h`,
      });
    }
    return buckets;
  }

  if (granularite === "jour") {
    for (let d = startOfDay(debut); d <= fin; d = addDays(d, 1)) {
      buckets.push({ debut: d, fin: endOfDay(d), label: `${d.getDate()}` });
    }
    return buckets;
  }

  // mois
  const formatMois = new Intl.DateTimeFormat("fr-FR", { month: "short" });
  for (let m = startOfMonth(debut); m <= fin; m = startOfMonth(addDays(endOfMonth(m), 1))) {
    buckets.push({ debut: m, fin: endOfMonth(m), label: formatMois.format(m) });
  }
  return buckets;
}

export function agregerParBucket(
  paiements: { date: Date; montant: Prisma.Decimal }[],
  buckets: Bucket[],
): { label: string; total: Prisma.Decimal }[] {
  return buckets.map((b) => {
    const total = paiements
      .filter((p) => p.date >= b.debut && p.date <= b.fin)
      .reduce((acc, p) => acc.add(p.montant), new Prisma.Decimal(0));
    return { label: b.label, total };
  });
}
