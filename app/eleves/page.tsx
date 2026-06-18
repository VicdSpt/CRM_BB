import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
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
        <Button render={<Link href="/eleves/nouveau" />}>
          Nouvel élève
        </Button>
      </div>

      <div className="mb-3">
        <RechercheEleves />
      </div>

      <div className="mb-4 text-sm">
        <Link
          href={showArchived ? "/eleves" : "/eleves?archives=1"}
          className="text-muted-foreground underline"
        >
          {showArchived ? "← Voir les élèves actifs" : "Voir les élèves archivés"}
        </Link>
      </div>

      {eleves.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun élève {showArchived ? "archivé" : ""} pour le moment.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {eleves.map((e) => (
            <li key={e.id}>
              <Link
                href={`/eleves/${e.id}`}
                className="hover:bg-muted flex items-center justify-between p-3"
              >
                <span className="font-medium">
                  {e.prenom} {e.nom}
                </span>
                <span className="text-muted-foreground text-sm">{e.telephone ?? ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
