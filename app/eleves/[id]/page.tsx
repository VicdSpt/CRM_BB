import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ActionsEleve } from "./actions-eleve";

export default async function FicheElevePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;
  const eleve = await prisma.eleve.findUnique({ where: { id } });
  if (!eleve) notFound();

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

      <ActionsEleve id={eleve.id} archive={eleve.archive} />
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
