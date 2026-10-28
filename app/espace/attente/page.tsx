import { redirect } from "next/navigation";
import { Hourglass, UserX } from "lucide-react";
import { getEleveSession } from "@/lib/auth/require-eleve";
import { etatAccesEleve } from "@/lib/auth/acces-eleve";
import { deconnexion } from "@/app/actions/session";
import { Button } from "@/components/ui/button";

// Seule page visible tant que le compte n'est pas validé (ou s'il a été refusé/archivé).
export default async function AttentePage() {
  const { eleve } = await getEleveSession();
  const etat = etatAccesEleve(eleve);
  if (etat === "valide") redirect("/espace");

  const enAttente = etat === "en_attente";
  const Icone = enAttente ? Hourglass : UserX;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col items-center justify-center gap-4 p-4 text-center">
      <Icone className="text-muted-foreground size-10" />
      <h1 className="text-xl font-semibold">
        {enAttente
          ? "Ton compte attend la validation du coach"
          : "Ton compte n'est pas actif. Contacte ton coach."}
      </h1>
      {enAttente ? (
        <p className="text-muted-foreground text-sm">
          Tu auras accès aux cours dès qu&apos;il aura validé ton inscription.
        </p>
      ) : null}
      <form action={deconnexion}>
        <Button type="submit" variant="outline">
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}
