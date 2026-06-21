import Link from "next/link";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  eachDayOfWeek,
} from "@/lib/planning/dates";
import { formatJourFr, formatHeureFr, toDateParam, parseDateParam } from "@/lib/planning/format";
import { PlanningNavigation } from "./navigation";
import { BadgeStatut } from "@/components/badge-statut";
import { libelleType } from "@/lib/planning/libelles";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; vue?: string }>;
}) {
  await requireCoach();
  const { date, vue: vueParam } = await searchParams;
  const vue = vueParam === "semaine" ? "semaine" : "jour";
  const ref = parseDateParam(date);

  const debut = vue === "semaine" ? startOfWeek(ref) : startOfDay(ref);
  const fin = vue === "semaine" ? endOfWeek(ref) : endOfDay(ref);

  const seances = await prisma.seance.findMany({
    where: { dateHeureDebut: { gte: debut, lte: fin } },
    orderBy: { dateHeureDebut: "asc" },
    include: { participations: { include: { eleve: true } } },
  });

  const jours = vue === "semaine" ? eachDayOfWeek(ref) : [startOfDay(ref)];

  const prevParam = toDateParam(addDays(ref, vue === "semaine" ? -7 : -1));
  const nextParam = toDateParam(addDays(ref, vue === "semaine" ? 7 : 1));
  const todayParam = toDateParam(new Date());

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Planning</h1>
        <Button render={<Link href="/planning/nouvelle" />}>Nouvelle séance</Button>
      </div>

      <div className="mb-4">
        <PlanningNavigation
          vue={vue}
          prevParam={prevParam}
          nextParam={nextParam}
          todayParam={todayParam}
        />
      </div>

      <div className="flex flex-col gap-6">
        {jours.map((jour) => {
          const duJour = seances.filter(
            (s) => s.dateHeureDebut >= startOfDay(jour) && s.dateHeureDebut <= endOfDay(jour),
          );
          return (
            <section key={jour.toISOString()}>
              <h2 className="text-muted-foreground mb-2 text-sm font-semibold capitalize">
                {formatJourFr(jour)}
              </h2>
              {duJour.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune séance.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {duJour.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/planning/${s.id}`}
                        className={`hover:bg-muted flex items-center justify-between gap-3 rounded-lg border border-l-4 p-3 ${
                          s.type === "PRIVE" ? "border-l-primary" : "border-l-sky-500"
                        }`}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium">
                            {formatHeureFr(s.dateHeureDebut)} · {libelleType(s.type)}
                          </span>
                          <span className="text-muted-foreground truncate text-sm">
                            {s.participations.map((p) => p.eleve.prenom).join(", ") ||
                              "Aucun élève"}
                          </span>
                        </span>
                        <BadgeStatut statut={s.statut} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
