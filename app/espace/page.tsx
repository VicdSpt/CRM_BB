import { requireEleve } from "@/lib/auth/require-eleve";
import Link from "next/link";
import { ProfilForm } from "./profil-form";
import { SuppressionCompte } from "./suppression-compte";

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
      <p className="text-muted-foreground mt-6 text-sm">
        Ce que nous faisons de tes données :{" "}
        <Link href="/confidentialite" className="text-primary underline">
          politique de confidentialité
        </Link>
      </p>
      <SuppressionCompte />
    </main>
  );
}
