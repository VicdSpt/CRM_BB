import Link from "next/link";
import type { MethodePaiement } from "@prisma/client";
import { requireCoach } from "@/lib/auth/require-coach";
import { rangePeriode, type Periode } from "@/lib/finances/periode";
import { getRevenuTotal, getRepartition, getImpayes, getEvolution } from "@/lib/finances/dashboard";
import { formatEuros } from "@/lib/finances/format";
import { parseDateParam, toDateParam } from "@/lib/planning/format";
import { granulariteParPeriode } from "@/lib/finances/evolution";
import { FiltresFinances } from "./filtres";
import { CamembertRepartition } from "@/components/finances/camembert-repartition";
import { CourbeEvolution } from "@/components/finances/courbe-evolution";
import { Initiales } from "@/components/initiales";
import { AnimBloc } from "@/components/anim-item";

const METHODES_VALIDES = ["ESPECES", "CB"] as const;

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
  const [total, repartition, impayes, evolution] = await Promise.all([
    getRevenuTotal(debut, fin, methode),
    getRepartition(debut, fin),
    getImpayes(),
    getEvolution(debut, fin, granulariteParPeriode(periode)),
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

      <AnimBloc index={0}>
        <section className="border-primary/30 from-primary/10 mb-6 rounded-xl border bg-linear-to-br to-transparent p-5">
          <p className="text-muted-foreground text-sm">Encaissé sur la période</p>
          <p className="text-4xl font-bold tracking-tight tabular-nums">
            {formatEuros(total.toString())}
          </p>
          {methode ? (
            <p className="text-muted-foreground mt-1 text-sm">Filtré : {sp.methode}</p>
          ) : null}
        </section>
      </AnimBloc>

      <AnimBloc index={1}>
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">Évolution du revenu</h2>
          <div className="rounded-lg border p-4">
            <CourbeEvolution data={evolution} />
          </div>
        </section>
      </AnimBloc>

      <AnimBloc index={2}>
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">Répartition (toutes méthodes)</h2>
          <div className="rounded-lg border p-4">
            <CamembertRepartition
              prive={repartition.prive.toString()}
              collectif={repartition.collectif.toString()}
              pack={repartition.pack.toString()}
            />
          </div>
        </section>
      </AnimBloc>

      <AnimBloc index={3}>
        <section>
          <h2 className="text-sm font-semibold">
            Impayés ({formatEuros(totalImpayes.toString())})
          </h2>
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
                    className="hover:bg-muted flex items-center gap-3 rounded-lg border p-3 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
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
      </AnimBloc>
    </main>
  );
}
