import type { Metadata } from "next";
import Link from "next/link";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Initiales } from "@/components/initiales";
import { SectionFinances, type ParamsFinances } from "./section-finances";
import { InfosCoachForm } from "./infos-coach-form";
import { MotDePasseForm } from "./mot-de-passe-form";

export const metadata: Metadata = { title: "Profil" };

// Onglets du profil, dans l'URL (?onglet=…) : seul l'onglet affiché est chargé.
// Les finances sont l'onglet par défaut (leurs filtres gardent l'URL /profil?…).
const ONGLETS = [
  { cle: "finances", libelle: "Finances", href: "/profil" },
  { cle: "infos", libelle: "Informations", href: "/profil?onglet=infos" },
  { cle: "mot-de-passe", libelle: "Mot de passe", href: "/profil?onglet=mot-de-passe" },
] as const;

type Onglet = (typeof ONGLETS)[number]["cle"];

const ongletDepuis = (v?: string): Onglet => ONGLETS.find((o) => o.cle === v)?.cle ?? "finances";

// Profil du coach : ses finances et les réglages de son compte, en onglets.
export default async function ProfilCoachPage({
  searchParams,
}: {
  searchParams: Promise<ParamsFinances & { onglet?: string }>;
}) {
  const session = await requireCoach();
  const sp = await searchParams;
  const onglet = ongletDepuis(sp.onglet);
  const coach = await prisma.coach.findUnique({
    where: { id: session.user.id },
    select: { nom: true, email: true },
  });
  const nom = coach?.nom ?? "";
  const email = coach?.email ?? "";

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-3">
        <Initiales prenom={nom} nom="" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{nom || "Profil"}</h1>
          <p className="text-muted-foreground truncate text-sm">{email}</p>
        </div>
      </header>

      <nav aria-label="Sections du profil" className="mb-6 flex gap-2 overflow-x-auto">
        {ONGLETS.map((o) => (
          <Link
            key={o.cle}
            href={o.href}
            aria-current={o.cle === onglet ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md border px-3 py-1.5 text-sm",
              o.cle === onglet
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted",
            )}
          >
            {o.libelle}
          </Link>
        ))}
      </nav>

      {onglet === "finances" ? <SectionFinances sp={sp} /> : null}

      {onglet === "infos" ? (
        <section aria-labelledby="titre-infos" className="rounded-lg border p-4">
          <h2 id="titre-infos" className="mb-4 text-sm font-semibold">
            Mes informations
          </h2>
          <InfosCoachForm nom={nom} email={email} />
        </section>
      ) : null}

      {onglet === "mot-de-passe" ? (
        <section aria-labelledby="titre-mdp" className="rounded-lg border p-4">
          <h2 id="titre-mdp" className="mb-4 text-sm font-semibold">
            Changer de mot de passe
          </h2>
          <MotDePasseForm />
        </section>
      ) : null}
    </main>
  );
}
