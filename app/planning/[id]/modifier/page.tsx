import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { updateSeance } from "@/lib/planning/actions";
import { toDateParam } from "@/lib/planning/format";
import { SeanceForm } from "../../seance-form";

function toDatetimeLocal(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${toDateParam(d)}T${h}:${min}`;
}

export default async function ModifierSeancePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;
  const seance = await prisma.seance.findUnique({
    where: { id },
    include: { participations: { select: { eleveId: true } } },
  });
  if (!seance) notFound();

  const eleves = await prisma.eleve.findMany({
    where: { archive: false },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    select: { id: true, prenom: true, nom: true },
  });

  const action = updateSeance.bind(null, id);
  const initial = {
    type: seance.type,
    dateHeureDebutLocal: toDatetimeLocal(seance.dateHeureDebut),
    dureeMinutes: seance.dureeMinutes,
    lieu: seance.lieu,
    prixReference: seance.prixReference.toString(),
    eleveIds: seance.participations.map((p) => p.eleveId),
  };

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href={`/planning/${id}`} className="text-muted-foreground text-sm">
        ← Retour à la séance
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Modifier la séance</h1>
      <SeanceForm action={action} eleves={eleves} initial={initial} submitLabel="Enregistrer" />
    </main>
  );
}
