import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatJourFr, formatHeureFr } from "@/lib/planning/format";
import { ActionsSeance } from "./actions-seance";

export default async function FicheSeancePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;
  const seance = await prisma.seance.findUnique({
    where: { id },
    include: { participations: { include: { eleve: true } } },
  });
  if (!seance) notFound();

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/planning" className="text-muted-foreground text-sm">
        ← Retour au planning
      </Link>
      <div className="mt-2 mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold capitalize">
          {seance.type === "PRIVE" ? "Cours privé" : "Cours collectif"}
        </h1>
        <Button variant="outline" render={<Link href={`/planning/${seance.id}/modifier`} />}>
          Modifier
        </Button>
      </div>

      <dl className="mb-6 flex flex-col gap-2 text-sm">
        <Info
          label="Date"
          value={`${formatJourFr(seance.dateHeureDebut)} à ${formatHeureFr(seance.dateHeureDebut)}`}
        />
        <Info label="Durée" value={`${seance.dureeMinutes} min`} />
        <Info label="Lieu" value={seance.lieu} />
        <Info label="Prix" value={`${seance.prixReference.toString()} €`} />
      </dl>

      <h2 className="mb-2 text-sm font-semibold">Élèves ({seance.participations.length})</h2>
      <ul className="mb-6 divide-y rounded-md border">
        {seance.participations.map((p) => (
          <li key={p.id} className="flex items-center justify-between p-3 text-sm">
            <Link href={`/eleves/${p.eleveId}`} className="font-medium hover:underline">
              {p.eleve.prenom} {p.eleve.nom}
            </Link>
            <span className="text-muted-foreground">{p.montant.toString()} € · à régler</span>
          </li>
        ))}
      </ul>

      <ActionsSeance id={seance.id} statut={seance.statut} />
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
