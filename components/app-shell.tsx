"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, User, Users } from "lucide-react";
import { coquillePour, type Role } from "@/lib/auth/roles";
import { Coquille } from "@/components/coquille";
import { EleveShell } from "@/components/eleve-shell";

const ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/planning", label: "Planning", icon: CalendarDays },
  { href: "/eleves", label: "Élèves", icon: Users },
  // Le profil du coach contient ses finances.
  { href: "/profil", label: "Profil", icon: User },
] as const;

// Le menu dépend du rôle de la session (fourni par le layout serveur), pas de l'URL.
export function AppShell({ role, children }: { role: Role | null; children: ReactNode }) {
  const pathname = usePathname();
  const coquille = coquillePour(role, pathname);

  if (coquille === "aucune") return <>{children}</>;

  if (coquille === "eleve") {
    return <EleveShell onglets={pathname !== "/espace/attente"}>{children}</EleveShell>;
  }

  return (
    <Coquille accueil="/" onglets={ITEMS}>
      {children}
    </Coquille>
  );
}
