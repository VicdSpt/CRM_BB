import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { updateEleve } from "@/lib/eleves/actions";
import { EleveForm } from "../../eleve-form";

export default async function ModifierElevePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;
  // Uniquement les champs du formulaire : EleveForm s'exécute dans le navigateur, la fiche
  // complète y enverrait l'empreinte du mot de passe et les données de compte.
  const eleve = await prisma.eleve.findUnique({
    where: { id },
    select: { prenom: true, nom: true, telephone: true, email: true, adresse: true, notes: true },
  });
  if (!eleve) notFound();

  const action = updateEleve.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href={`/eleves/${id}`} className="text-muted-foreground text-sm">
        ← Retour à la fiche
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Modifier l&apos;élève</h1>
      <EleveForm action={action} initial={eleve} submitLabel="Enregistrer" />
    </main>
  );
}
