import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Initiales } from "@/components/initiales";
import { AnimItem } from "@/components/anim-item";
import { RechercheEleves } from "./recherche";

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archives?: string }>;
}) {
  await requireCoach();
  const { q, archives } = await searchParams;
  const showArchived = archives === "1";

  const where: Prisma.EleveWhereInput = { archive: showArchived };
  if (q) {
    where.OR = [
      { prenom: { contains: q, mode: "insensitive" } },
      { nom: { contains: q, mode: "insensitive" } },
    ];
  }

  const eleves = await prisma.eleve.findMany({
    where,
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Élèves</h1>
        <Button render={<Link href="/eleves/nouveau" />}>Nouvel élève</Button>
      </div>

      <div className="mb-3">
        <RechercheEleves />
      </div>

      <div className="mb-4">
        <Link
          href={showArchived ? "/eleves" : "/eleves?archives=1"}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          {showArchived ? "← Voir les élèves actifs" : "Voir les élèves archivés"}
        </Link>
      </div>

      {eleves.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="text-muted-foreground mb-3 text-sm">
            Aucun élève {showArchived ? "archivé" : ""} pour le moment.
          </p>
          {!showArchived ? (
            <Button render={<Link href="/eleves/nouveau" />}>Ajouter un élève</Button>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {eleves.map((e, i) => (
            <AnimItem key={e.id} index={i}>
              <Link
                href={`/eleves/${e.id}`}
                className="hover:bg-muted flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <Initiales prenom={e.prenom} nom={e.nom} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">
                    {e.prenom} {e.nom}
                  </span>
                  {e.telephone ? (
                    <span className="text-muted-foreground text-sm">{e.telephone}</span>
                  ) : null}
                </span>
                <ChevronRight className="text-muted-foreground ml-auto size-5" />
              </Link>
            </AnimItem>
          ))}
        </ul>
      )}
    </main>
  );
}
