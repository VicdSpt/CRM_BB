import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "@/lib/planning/dates";

export type Periode = "jour" | "semaine" | "mois" | "annee";

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function rangePeriode(periode: Periode, ref: Date): { debut: Date; fin: Date } {
  switch (periode) {
    case "jour":
      return { debut: startOfDay(ref), fin: endOfDay(ref) };
    case "semaine":
      return { debut: startOfWeek(ref), fin: endOfWeek(ref) };
    case "annee":
      return { debut: startOfYear(ref), fin: endOfYear(ref) };
    case "mois":
    default:
      return { debut: startOfMonth(ref), fin: endOfMonth(ref) };
  }
}
