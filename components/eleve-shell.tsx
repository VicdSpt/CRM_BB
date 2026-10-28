"use client";

import type { ReactNode } from "react";
import { CalendarDays, User } from "lucide-react";
import { Coquille } from "@/components/coquille";

// Accueil élève = son profil et ses cours ; « Réserver » = catalogue des cours collectifs.
const ONGLETS_ELEVE = [
  { href: "/espace", label: "Profil", icon: User },
  { href: "/espace/cours", label: "Réserver", icon: CalendarDays },
] as const;

// Coquille de l'espace élève ; sans onglets sur la page d'attente.
export function EleveShell({ children, onglets }: { children: ReactNode; onglets: boolean }) {
  return (
    <Coquille accueil="/espace" onglets={onglets ? ONGLETS_ELEVE : []}>
      {children}
    </Coquille>
  );
}
