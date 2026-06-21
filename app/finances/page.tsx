import Link from "next/link";
import type { MethodePaiement } from "@prisma/client";
import { requireCoach } from "@/lib/auth/require-coach";
import { rangePeriode, type Periode } from "@/lib/finances/periode";
import { getRevenuTotal, getRepartition, getImpayes } from "@/lib/finances/dashboard";
import { formatEuros } from "@/lib/finances/format";
import { parseDateParam, toDateParam } from "@/lib/planning/format";
import { FiltresFinances } from "./filtres";
import { BarreRepartition } from "@/components/barre-repartition";
import { Initiales } from "@/components/initiales";

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

  const totalRepartition = repartition.prive
    .add(repartition.collectif)
    .add(repartition.pack)
    .toString();

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <Link href="/" className="text-muted-foreground text-sm">
        ← Tableau de bord
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Finances</h1>

      <div className="mb-4">
        <FiltresFinances periode={periode} date={toDateParam(ref)} methode={sp.methode ?? ""} />
      </div>

      <section className="border-primary/30 from-primary/10 mb-6 rounded-xl border bg-linear-to-br to-transparent p-5">
        <p className="text-muted-foreground text-sm">Encaissé sur la période</p>
        <p className="text-4xl font-bold tracking-tight tabular-nums">
          {formatEuros(total.toString())}
        </p>
        {methode ? (
          <p className="text-muted-foreground mt-1 text-sm">Filtré : {sp.methode}</p>
        ) : null}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Répartition (toutes méthodes)</h2>
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <BarreRepartition
            label="Cours privés"
            montant={repartition.prive.toString()}
            total={totalRepartition}
          />
          <BarreRepartition
            label="Cours collectifs"
            montant={repartition.collectif.toString()}
            total={totalRepartition}
          />
          <BarreRepartition
            label="Packs"
            montant={repartition.pack.toString()}
            total={totalRepartition}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Impayés ({formatEuros(totalImpayes.toString())})</h2>
        <p className="text-muted-foreground mb-2 text-xs">
          État courant, indépendant de la période et de la méthode.
        </p>
        {impayes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun impayé. 🎉</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {impayes.map((i) => (
              <li key={i.eleveId}>
                <Link
                  href={`/eleves/${i.eleveId}`}
                  className="hover:bg-muted flex items-center gap-3 rounded-lg border p-3 text-sm"
                >
                  <Initiales prenom={i.nom} nom="" />
                  <span className="font-medium">{i.nom}</span>
                  <span className="text-muted-foreground ml-auto tabular-nums">
                    {formatEuros(i.total.toString())}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
