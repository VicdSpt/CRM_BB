import { requireEleve } from "@/lib/auth/require-eleve";
import { ProfilForm } from "./profil-form";

// Accueil de l'élève : son profil (coordonnées modifiables).
export default async function ProfilElevePage() {
  const { eleve } = await requireEleve();

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <h1 className="mb-1 text-2xl font-semibold">Mon profil</h1>
      <p className="text-muted-foreground mb-4">
        {eleve.prenom} {eleve.nom}
      </p>
      {/* Seuls les champs modifiables par l'élève sont transmis (jamais les notes du coach). */}
      <ProfilForm email={eleve.email} telephone={eleve.telephone} adresse={eleve.adresse} />
    </main>
  );
}
