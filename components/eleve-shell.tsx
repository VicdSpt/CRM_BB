"use client";

import type { ReactNode } from "react";
import { CalendarDays, User } from "lucide-react";
import { Coquille } from "@/components/coquille";

const ONGLETS_ELEVE = [
  { href: "/espace", label: "Cours", icon: CalendarDays },
  { href: "/espace/profil", label: "Profil", icon: User },
] as const;

// Coquille de l'espace élève ; sans onglets sur la page d'attente.
export function EleveShell({ children, onglets }: { children: ReactNode; onglets: boolean }) {
  return (
    <Coquille accueil="/espace" onglets={onglets ? ONGLETS_ELEVE : []}>
      {children}
    </Coquille>
  );
}
