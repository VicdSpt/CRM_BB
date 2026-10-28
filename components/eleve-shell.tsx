"use client";

import type { ReactNode } from "react";
import { CalendarDays, CalendarPlus, User } from "lucide-react";
import { Coquille } from "@/components/coquille";

// Accueil élève = son profil ; « Réserver » = catalogue des cours collectifs ;
// « Mes cours » = tous ses cours (privés et collectifs), à venir et passés.
const ONGLETS_ELEVE = [
  { href: "/espace", label: "Profil", icon: User },
  { href: "/espace/cours", label: "Réserver", icon: CalendarPlus },
  { href: "/espace/mes-cours", label: "Mes cours", icon: CalendarDays },
] as const;

// Coquille de l'espace élève ; sans onglets sur la page d'attente.
export function EleveShell({ children, onglets }: { children: ReactNode; onglets: boolean }) {
  return (
    <Coquille accueil="/espace" onglets={onglets ? ONGLETS_ELEVE : []}>
      {children}
    </Coquille>
  );
}
