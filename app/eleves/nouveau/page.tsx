import { requireCoach } from "@/lib/auth/require-coach";
import { createEleve } from "@/lib/eleves/actions";
import { EleveForm } from "../eleve-form";
import { BoutonRetour } from "@/components/bouton-retour";

export default async function NouvelElevePage() {
  await requireCoach();
  return (
    <main className="mx-auto w-full max-w-md p-4">
      <BoutonRetour href="/eleves">Élèves</BoutonRetour>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Nouvel élève</h1>
      <EleveForm action={createEleve} submitLabel="Créer l'élève" />
    </main>
  );
}
