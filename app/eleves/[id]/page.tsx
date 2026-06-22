import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ActionsEleve } from "./actions-eleve";
import { PackForm } from "./pack-form";
import { PackItem } from "./pack-item";
import { Initiales } from "@/components/initiales";

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
    include: { paiement: true },
  });

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

      <dl className="mb-6 flex flex-col gap-2 rounded-lg border p-4 text-sm">
        <Info label="Téléphone" value={eleve.telephone} />
        <Info label="Email" value={eleve.email} />
        <Info label="Notes" value={eleve.notes} />
      </dl>

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
