import Link from "next/link";
import { requireCoach } from "@/lib/auth/require-coach";
import { createEleve } from "@/lib/eleves/actions";
import { EleveForm } from "../eleve-form";

export default async function NouvelElevePage() {
  await requireCoach();
  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/eleves" className="text-muted-foreground text-sm">
        ← Retour à la liste
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Nouvel élève</h1>
      <EleveForm action={createEleve} submitLabel="Créer l'élève" />
    </main>
  );
}
