import Link from "next/link";
import { CalendarPlus, UserPlus } from "lucide-react";
import { Prisma } from "@prisma/client";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/planning/dates";
import { rangePeriode } from "@/lib/finances/periode";
import { getRevenuTotal, getImpayes } from "@/lib/finances/dashboard";
import { formatJourFr, formatHeureFr } from "@/lib/planning/format";
import { formatEuros } from "@/lib/finances/format";
import { prochaineSeance } from "@/lib/accueil";
import { Button } from "@/components/ui/button";
import { AnimItem, AnimBloc } from "@/components/anim-item";

export default async function HomePage() {
  await requireCoach();
  const maintenant = new Date();

  const seancesDuJour = await prisma.seance.findMany({
    where: { dateHeureDebut: { gte: startOfDay(maintenant), lte: endOfDay(maintenant) } },
    orderBy: { dateHeureDebut: "asc" },
    include: { participations: { include: { eleve: true } } },
  });
  const prochaine = prochaineSeance(seancesDuJour, maintenant);

  const { debut, fin } = rangePeriode("mois", maintenant);
  const [encaisseMois, impayes] = await Promise.all([getRevenuTotal(debut, fin), getImpayes()]);
  const totalImpayes = impayes.reduce((acc, i) => acc.add(i.total), new Prisma.Decimal(0));

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <AnimBloc index={0}>
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Bonjour Bart !</h1>
          <p className="text-muted-foreground text-sm capitalize">{formatJourFr(maintenant)}</p>
        </header>
      </AnimBloc>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold">Aujourd&apos;hui</h2>
        {seancesDuJour.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm">
            <p className="text-muted-foreground mb-3">Aucune séance prévue aujourd&apos;hui.</p>
            <Button render={<Link href="/planning/nouvelle" />}>Planifier une séance</Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {seancesDuJour.map((s, i) => {
              const estProchaine = prochaine?.id === s.id;
              return (
                <AnimItem key={s.id} index={i}>
                  <Link
                    href={`/planning/${s.id}`}
                    className={`hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
                      estProchaine ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">
                        {formatHeureFr(s.dateHeureDebut)} ·{" "}
                        {s.type === "PRIVE" ? "Privé" : "Collectif"}
                        {estProchaine ? (
                          <span className="text-primary font-semibold"> · prochain</span>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {s.participations.map((p) => p.eleve.prenom).join(", ") || "Aucun élève"}
                      </span>
                    </span>
                  </Link>
                </AnimItem>
              );
            })}
          </ul>
        )}
      </section>

      <AnimBloc index={3}>
        <section className="mb-6 grid grid-cols-2 gap-3">
          <Button render={<Link href="/planning/nouvelle" />}>
            <CalendarPlus className="size-4" /> Nouvelle séance
          </Button>
          <Button variant="outline" render={<Link href="/eleves/nouveau" />}>
            <UserPlus className="size-4" /> Nouvel élève
          </Button>
        </section>
      </AnimBloc>

      <AnimBloc index={4}>
        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/finances"
            className="hover:bg-muted rounded-lg border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
          >
            <p className="text-muted-foreground text-xs">Encaissé ce mois</p>
            <p className="text-xl font-semibold">{formatEuros(encaisseMois.toString())}</p>
          </Link>
          <Link
            href="/finances"
            className="hover:bg-muted rounded-lg border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
          >
            <p className="text-muted-foreground text-xs">Impayés</p>
            <p className="text-xl font-semibold">{formatEuros(totalImpayes.toString())}</p>
          </Link>
        </section>
      </AnimBloc>
    </main>
  );
}
