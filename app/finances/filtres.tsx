"use client";

import { useRouter } from "next/navigation";
import type { Periode } from "@/lib/finances/periode";

const PERIODES: Array<[Periode, string]> = [
  ["jour", "Jour"],
  ["semaine", "Semaine"],
  ["mois", "Mois"],
  ["annee", "Année"],
];

const METHODES: Array<[string, string]> = [
  ["", "Toutes méthodes"],
  ["ESPECES", "Espèces"],
  ["CB", "CB"],
  ["VIREMENT", "Virement"],
];

export function FiltresFinances({
  periode,
  date,
  methode,
}: {
  periode: Periode;
  date: string;
  methode: string;
}) {
  const router = useRouter();
  const naviguer = (next: { periode?: Periode; date?: string; methode?: string }) => {
    const params = new URLSearchParams({
      periode: next.periode ?? periode,
      date: next.date ?? date,
      methode: next.methode ?? methode,
    });
    router.push(`/finances?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PERIODES.map(([value, label]) => (
          <button
            key={value}
            onClick={() => naviguer({ periode: value })}
            className={`cursor-pointer rounded-md border px-3 py-1 text-sm ${
              periode === value
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => naviguer({ date: e.target.value })}
          className="bg-background text-foreground h-9 rounded-md border px-3 text-sm"
        />
        <select
          value={methode}
          onChange={(e) => naviguer({ methode: e.target.value })}
          className="bg-background text-foreground h-9 rounded-md border px-3 text-sm"
        >
          {METHODES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
