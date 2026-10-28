"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Users, Wallet } from "lucide-react";
import { isActive } from "@/lib/nav";
import { Coquille } from "@/components/coquille";
import { EleveShell } from "@/components/eleve-shell";

const ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/planning", label: "Planning", icon: CalendarDays },
  { href: "/eleves", label: "Élèves", icon: Users },
  { href: "/finances", label: "Finances", icon: Wallet },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Les pages publiques (connexion, inscription) restent hors coquille.
  if (pathname === "/login" || pathname === "/inscription") {
    return <>{children}</>;
  }

  if (isActive(pathname, "/espace")) {
    return <EleveShell onglets={pathname !== "/espace/attente"}>{children}</EleveShell>;
  }

  return (
    <Coquille accueil="/" onglets={ITEMS}>
      {children}
    </Coquille>
  );
}
