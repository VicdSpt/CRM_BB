import type { Metadata } from "next";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Initiales } from "@/components/initiales";
import { SectionFinances, type ParamsFinances } from "./section-finances";
import { InfosCoachForm } from "./infos-coach-form";
import { MotDePasseForm } from "./mot-de-passe-form";

export const metadata: Metadata = { title: "Profil" };

// Profil du coach : ses finances, puis les réglages de son compte.
export default async function ProfilCoachPage({
  searchParams,
}: {
  searchParams: Promise<ParamsFinances>;
}) {
  const session = await requireCoach();
  const [coach, sp] = await Promise.all([
    prisma.coach.findUnique({
      where: { id: session.user.id },
      select: { nom: true, email: true },
    }),
    searchParams,
  ]);
  const nom = coach?.nom ?? "";
  const email = coach?.email ?? "";

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <header className="mb-8 flex items-center gap-3">
        <Initiales prenom={nom} nom="" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{nom || "Profil"}</h1>
          <p className="text-muted-foreground truncate text-sm">{email}</p>
        </div>
      </header>

      <SectionFinances sp={sp} />

      <section aria-labelledby="titre-compte" className="flex flex-col gap-6">
        <h2 id="titre-compte" className="text-xl font-semibold">
          Mon compte
        </h2>
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold">Mes informations</h3>
          <InfosCoachForm nom={nom} email={email} />
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold">Mot de passe</h3>
          <MotDePasseForm />
        </div>
      </section>
    </main>
  );
}
