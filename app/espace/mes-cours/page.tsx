import Link from "next/link";
import { requireEleve } from "@/lib/auth/require-eleve";
import { mesCours, type MonCours } from "@/lib/espace/queries";
import { repartirCours } from "@/lib/espace/historique";
import { peutSeDesinscrire } from "@/lib/espace/regles";
import { formatHeureFr, formatJourFr } from "@/lib/planning/format";
import { formatEuros } from "@/lib/finances/format";
import { Button } from "@/components/ui/button";
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

function ListeCours({ cours, now, vide }: { cours: MonCours[]; now: Date; vide: string }) {
  if (cours.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border p-4 text-center text-sm">{vide}</p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {cours.map((c) => (
        <LigneCours key={c.seanceId} {...versLigne(c, now)} />
      ))}
    </ul>
  );
}

// Tous les cours de l'élève (séances privées et collectives), à venir puis passés.
export default async function MesCoursPage() {
  const { eleve } = await requireEleve();
  const now = new Date();
  const { aVenir, passes } = repartirCours(await mesCours(eleve.id), now);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Mes cours</h1>
        <Button size="sm" variant="outline" render={<Link href="/espace/cours" />}>
          Réserver un cours
        </Button>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">À venir</h2>
        <ListeCours cours={aVenir} now={now} vide="Aucun cours à venir." />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Passés</h2>
        <ListeCours cours={passes} now={now} vide="Aucun cours pour le moment." />
      </section>
    </main>
  );
}
