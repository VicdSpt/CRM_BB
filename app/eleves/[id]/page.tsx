import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma, type StatutReglement } from "@prisma/client";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatEuros } from "@/lib/finances/format";
import { formatJourFr } from "@/lib/planning/format";
import { libelleType } from "@/lib/planning/libelles";
import { ActionsEleve } from "./actions-eleve";
import { PackForm } from "./pack-form";
import { PackItem } from "./pack-item";
import { Initiales } from "@/components/initiales";
import { AnimItem, AnimBloc } from "@/components/anim-item";

export default async function FicheElevePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  await requireCoach();
  const { id } = await params;
  const { onglet } = await searchParams;
  const eleve = await prisma.eleve.findUnique({ where: { id } });
  if (!eleve) notFound();

  const ongletHistorique = onglet === "historique";

  const ongletClass = (actif: boolean) =>
    `cursor-pointer rounded-md border px-3 py-1.5 text-sm ${
      actif ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
    }`;

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/eleves" className="text-muted-foreground text-sm">
        ← Retour à la liste
      </Link>
      <div className="mt-2 mb-4 flex items-center gap-3">
        <Initiales prenom={eleve.prenom} nom={eleve.nom} className="size-12 text-base" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-2xl font-semibold">
            {eleve.prenom} {eleve.nom}
          </h1>
          {eleve.archive ? <span className="text-muted-foreground text-xs">Archivé</span> : null}
        </div>
        <Button variant="outline" render={<Link href={`/eleves/${eleve.id}/modifier`} />}>
          Modifier
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <Link href={`/eleves/${eleve.id}`} className={ongletClass(!ongletHistorique)}>
          Fiche
        </Link>
        <Link
          href={`/eleves/${eleve.id}?onglet=historique`}
          className={ongletClass(ongletHistorique)}
        >
          Historique
        </Link>
      </div>

      {ongletHistorique ? <OngletHistorique eleveId={eleve.id} /> : <OngletFiche eleve={eleve} />}
    </main>
  );
}

async function OngletFiche({
  eleve,
}: {
  eleve: {
    id: string;
    telephone: string | null;
    email: string | null;
    notes: string | null;
    archive: boolean;
  };
}) {
  const [nbParticipations, nbPacks, nbPaiements, packs, totalPayeAgg, totalDuAgg] =
    await Promise.all([
      prisma.participation.count({ where: { eleveId: eleve.id } }),
      prisma.pack.count({ where: { eleveId: eleve.id } }),
      prisma.paiement.count({ where: { eleveId: eleve.id } }),
      prisma.pack.findMany({
        where: { eleveId: eleve.id },
        orderBy: { dateAchat: "desc" },
        include: { paiement: true },
      }),
      prisma.paiement.aggregate({ _sum: { montant: true }, where: { eleveId: eleve.id } }),
      prisma.participation.aggregate({
        _sum: { montant: true },
        where: { eleveId: eleve.id, statutReglement: "A_REGLER" },
      }),
    ]);
  const peutSupprimer = nbParticipations + nbPacks + nbPaiements === 0;
  const totalPaye = totalPayeAgg._sum.montant ?? new Prisma.Decimal(0);
  const totalDu = totalDuAgg._sum.montant ?? new Prisma.Decimal(0);

  return (
    <>
      <AnimBloc index={0}>
        <dl className="mb-6 flex flex-col gap-2 rounded-lg border p-4 text-sm">
          <Info label="Téléphone" value={eleve.telephone} />
          <Info label="Email" value={eleve.email} />
          <Info label="Notes" value={eleve.notes} />
        </dl>
      </AnimBloc>

      <AnimBloc index={1}>
        <section className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-xs">Payé</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatEuros(totalPaye.toString())}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-xs">Reste dû</p>
            <p className="text-xl font-semibold tabular-nums">{formatEuros(totalDu.toString())}</p>
          </div>
        </section>
      </AnimBloc>

      <AnimBloc index={2}>
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Packs</h2>
          {packs.length === 0 ? (
            <p className="text-muted-foreground mb-3 text-sm">Aucun pack.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {packs.map((p) => (
                <PackItem
                  key={p.id}
                  pack={{
                    id: p.id,
                    nbSeancesTotal: p.nbSeancesTotal,
                    nbSeancesRestantes: p.nbSeancesRestantes,
                    montantPaye: p.montantPaye.toString(),
                    methode: p.paiement?.methode ?? "ESPECES",
                  }}
                />
              ))}
            </ul>
          )}
          <PackForm eleveId={eleve.id} />
        </section>
      </AnimBloc>

      <AnimBloc index={3}>
        <ActionsEleve id={eleve.id} archive={eleve.archive} peutSupprimer={peutSupprimer} />
      </AnimBloc>
    </>
  );
}

async function OngletHistorique({ eleveId }: { eleveId: string }) {
  const historique = await prisma.participation.findMany({
    where: { eleveId },
    orderBy: { seance: { dateHeureDebut: "desc" } },
    include: { seance: true },
  });

  if (historique.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucune séance.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {historique.map((p, i) => (
        <AnimItem key={p.id} index={i}>
          <Link
            href={`/planning/${p.seanceId}`}
            className="hover:bg-muted flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
          >
            <span className="flex min-w-0 flex-col">
              <span className="font-medium capitalize">
                {formatJourFr(p.seance.dateHeureDebut)}
              </span>
              <span className="text-muted-foreground">{libelleType(p.seance.type)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <BadgeReglement statut={p.statutReglement} />
              <span className="text-muted-foreground tabular-nums">
                {formatEuros(p.montant.toString())}
              </span>
            </span>
          </Link>
        </AnimItem>
      ))}
    </ul>
  );
}

function BadgeReglement({ statut }: { statut: StatutReglement }) {
  const map: Record<StatutReglement, [string, string]> = {
    A_REGLER: ["À régler", "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"],
    PAYE: ["Payé", "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"],
    COUVERT_PAR_PACK: ["Pack", "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"],
  };
  const [label, cls] = map[statut];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value ?? "—"}</dd>
    </div>
  );
}
