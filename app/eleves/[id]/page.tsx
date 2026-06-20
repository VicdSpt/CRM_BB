import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatEuros } from "@/lib/finances/format";
import { ActionsEleve } from "./actions-eleve";
import { PackForm } from "./pack-form";

export default async function FicheElevePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;
  const eleve = await prisma.eleve.findUnique({ where: { id } });
  if (!eleve) notFound();

  const [nbParticipations, nbPacks, nbPaiements] = await Promise.all([
    prisma.participation.count({ where: { eleveId: eleve.id } }),
    prisma.pack.count({ where: { eleveId: eleve.id } }),
    prisma.paiement.count({ where: { eleveId: eleve.id } }),
  ]);
  const peutSupprimer = nbParticipations + nbPacks + nbPaiements === 0;

  const packs = await prisma.pack.findMany({
    where: { eleveId: eleve.id },
    orderBy: { dateAchat: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/eleves" className="text-muted-foreground text-sm">
        ← Retour à la liste
      </Link>
      <div className="mt-2 mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {eleve.prenom} {eleve.nom}
        </h1>
        <Button variant="outline" render={<Link href={`/eleves/${eleve.id}/modifier`} />}>
          Modifier
        </Button>
      </div>

      {eleve.archive ? (
        <p className="bg-muted mb-4 inline-block rounded px-2 py-1 text-sm">Archivé</p>
      ) : null}

      <dl className="mb-6 flex flex-col gap-2 text-sm">
        <Info label="Téléphone" value={eleve.telephone} />
        <Info label="Email" value={eleve.email} />
        <Info label="Notes" value={eleve.notes} />
      </dl>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold">Packs</h2>
        {packs.length === 0 ? (
          <p className="text-muted-foreground mb-3 text-sm">Aucun pack.</p>
        ) : (
          <ul className="mb-3 divide-y rounded-md border">
            {packs.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3 text-sm">
                <span>
                  {p.nbSeancesRestantes}/{p.nbSeancesTotal} séances restantes
                </span>
                <span className="text-muted-foreground">
                  {formatEuros(p.montantPaye.toString())}
                </span>
              </li>
            ))}
          </ul>
        )}
        <PackForm eleveId={eleve.id} />
      </section>

      <ActionsEleve id={eleve.id} archive={eleve.archive} peutSupprimer={peutSupprimer} />
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value ?? "—"}</dd>
    </div>
  );
}
