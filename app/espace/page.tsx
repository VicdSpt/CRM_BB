import Link from "next/link";
import { requireEleve } from "@/lib/auth/require-eleve";
import { mesCours, type MonCours } from "@/lib/espace/queries";
import { repartirCours } from "@/lib/espace/historique";
import { peutSeDesinscrire } from "@/lib/espace/regles";
import { formatHeureFr, formatJourFr } from "@/lib/planning/format";
import { formatEuros } from "@/lib/finances/format";
import { Button } from "@/components/ui/button";
import { ProfilForm } from "./profil-form";
import { LigneCours, type LigneCoursProps } from "./ligne-cours";

function versLigne(c: MonCours, now: Date): LigneCoursProps {
  const verdict = peutSeDesinscrire(
    {
      type: c.type,
      statut: c.statut,
      debut: c.debut,
      nbInscrits: 0,
      capacite: 0,
      inscrit: true,
      statutReglement: c.statutReglement,
    },
    now,
  );
  return {
    seanceId: c.seanceId,
    date: formatJourFr(c.debut),
    heure: formatHeureFr(c.debut),
    dureeMinutes: c.dureeMinutes,
    type: c.type,
    lieu: c.lieu,
    montant: formatEuros(c.montant),
    reglement: c.statutReglement,
    annule: c.statut === "ANNULEE",
    desinscriptionPossible: c.debut > now && c.statut !== "ANNULEE" && verdict.ok,
  };
}

// Accueil de l'élève : son profil et l'historique de ses cours (privés et collectifs).
export default async function ProfilElevePage() {
  const { eleve } = await requireEleve();
  const now = new Date();
  const { aVenir, passes } = repartirCours(await mesCours(eleve.id), now);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <section>
        <h1 className="mb-1 text-2xl font-semibold">Mon profil</h1>
        <p className="text-muted-foreground mb-4">
          {eleve.prenom} {eleve.nom}
        </p>
        {/* Seuls les champs modifiables par l'élève sont transmis (jamais les notes du coach). */}
        <ProfilForm email={eleve.email} telephone={eleve.telephone} adresse={eleve.adresse} />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Mes prochains cours</h2>
          <Button size="sm" variant="outline" render={<Link href="/espace/cours" />}>
            Réserver un cours
          </Button>
        </div>
        {aVenir.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border p-4 text-center text-sm">
            Aucun cours à venir.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {aVenir.map((c) => (
              <LigneCours key={c.seanceId} {...versLigne(c, now)} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Mes cours passés</h2>
        {passes.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border p-4 text-center text-sm">
            Aucun cours pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {passes.map((c) => (
              <LigneCours key={c.seanceId} {...versLigne(c, now)} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
