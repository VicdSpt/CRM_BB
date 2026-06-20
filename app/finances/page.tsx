import Link from "next/link";
import type { MethodePaiement } from "@prisma/client";
import { requireCoach } from "@/lib/auth/require-coach";
import { rangePeriode, type Periode } from "@/lib/finances/periode";
import { getRevenuTotal, getRepartition, getImpayes } from "@/lib/finances/dashboard";
import { formatEuros } from "@/lib/finances/format";
import { parseDateParam, toDateParam } from "@/lib/planning/format";
import { FiltresFinances } from "./filtres";

const METHODES_VALIDES = ["ESPECES", "CB", "VIREMENT"] as const;

function parsePeriode(v?: string): Periode {
  return v === "jour" || v === "semaine" || v === "annee" ? v : "mois";
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; date?: string; methode?: string }>;
}) {
  await requireCoach();
  const sp = await searchParams;
  const periode = parsePeriode(sp.periode);
  const ref = parseDateParam(sp.date);
  const methode = (METHODES_VALIDES as readonly string[]).includes(sp.methode ?? "")
    ? (sp.methode as MethodePaiement)
    : undefined;

  const { debut, fin } = rangePeriode(periode, ref);
  const [total, repartition, impayes] = await Promise.all([
    getRevenuTotal(debut, fin, methode),
    getRepartition(debut, fin),
    getImpayes(),
  ]);

  const totalImpayes = impayes.reduce((acc, i) => acc.add(i.total), repartition.prive.mul(0));

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <Link href="/" className="text-muted-foreground text-sm">
        ← Tableau de bord
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Finances</h1>

      <div className="mb-4">
        <FiltresFinances periode={periode} date={toDateParam(ref)} methode={sp.methode ?? ""} />
      </div>

      <section className="mb-6 rounded-md border p-4">
        <p className="text-muted-foreground text-sm">Encaissé sur la période</p>
        <p className="text-3xl font-semibold">{formatEuros(total.toString())}</p>
        {methode ? <p className="text-muted-foreground text-sm">Filtré : {sp.methode}</p> : null}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold">Répartition (toutes méthodes)</h2>
        <ul className="divide-y rounded-md border">
          <Ligne label="Cours privés" value={repartition.prive.toString()} />
          <Ligne label="Cours collectifs" value={repartition.collectif.toString()} />
          <Ligne label="Packs" value={repartition.pack.toString()} />
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">
          Impayés ({formatEuros(totalImpayes.toString())})
        </h2>
        {impayes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun impayé. 🎉</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {impayes.map((i) => (
              <li key={i.eleveId} className="flex items-center justify-between p-3 text-sm">
                <Link href={`/eleves/${i.eleveId}`} className="font-medium hover:underline">
                  {i.nom}
                </Link>
                <span className="text-muted-foreground">{formatEuros(i.total.toString())}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Ligne({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between p-3 text-sm">
      <span>{label}</span>
      <span className="text-muted-foreground">{formatEuros(value)}</span>
    </li>
  );
}
