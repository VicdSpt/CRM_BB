import Link from "next/link";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { createSeance } from "@/lib/planning/actions";
import { SeanceForm } from "../seance-form";

export default async function NouvelleSeancePage() {
  await requireCoach();
  const eleves = await prisma.eleve.findMany({
    where: { archive: false },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    select: { id: true, prenom: true, nom: true },
  });

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/planning" className="text-muted-foreground text-sm">
        ← Retour au planning
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Nouvelle séance</h1>
      <SeanceForm action={createSeance} eleves={eleves} submitLabel="Créer la séance" />
    </main>
  );
}
