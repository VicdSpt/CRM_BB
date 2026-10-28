import { requireEleve } from "@/lib/auth/require-eleve";
import { coursAVenir } from "@/lib/espace/queries";
import { DELAI_DESINSCRIPTION_HEURES, etatCours } from "@/lib/espace/regles";
import { formatHeureFr, formatJourFr, toDateParam } from "@/lib/planning/format";
import { formatEuros } from "@/lib/finances/format";
import { CarteCours, type CarteCoursProps } from "./carte-cours";

export default async function CoursElevePage() {
  const { eleve } = await requireEleve();
  const now = new Date();
  const cours = await coursAVenir(eleve.id, now);

  // Groupement par jour (heure locale serveur, cf. ADR 0006).
  const jours = new Map<string, { libelle: string; cours: CarteCoursProps[] }>();
  for (const c of cours) {
    const cle = toDateParam(c.debut);
    if (!jours.has(cle)) jours.set(cle, { libelle: formatJourFr(c.debut), cours: [] });
    jours.get(cle)!.cours.push({
      id: c.id,
      heure: formatHeureFr(c.debut),
      dureeMinutes: c.dureeMinutes,
      lieu: c.lieu,
      prix: formatEuros(c.prix),
      etat: etatCours(c, now),
      nbInscrits: c.nbInscrits,
      capacite: c.capacite,
    });
  }

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <h1 className="mb-1 text-2xl font-semibold">Cours collectifs</h1>
      <p className="text-muted-foreground mb-4 text-sm">
        Désinscription possible jusqu&apos;à {DELAI_DESINSCRIPTION_HEURES} h avant le cours.
      </p>

      {jours.size === 0 ? (
        <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">
          Aucun cours collectif prévu pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {[...jours.entries()].map(([cle, jour]) => (
            <section key={cle}>
              <h2 className="mb-2 text-sm font-semibold capitalize">{jour.libelle}</h2>
              <ul className="flex flex-col gap-2">
                {jour.cours.map((c) => (
                  <CarteCours key={c.id} {...c} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
