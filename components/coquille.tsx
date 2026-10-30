"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, type LucideIcon } from "lucide-react";
import { isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { deconnexion } from "@/app/actions/session";

export type OngletCoquille = { href: string; label: string; icon: LucideIcon };

// Structure commune aux espaces coach et élève : barre du haut (mobile),
// sidebar (PC) et barre d'onglets en bas (mobile).
export function Coquille({
  accueil,
  onglets,
  children,
}: {
  accueil: string;
  onglets: readonly OngletCoquille[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const avecOnglets = onglets.length > 0;
  // L'onglet d'accueil n'est actif que sur sa page exacte (sinon /espace
  // resterait actif sur /espace/profil).
  const actif = (href: string) => (href === accueil ? pathname === href : isActive(pathname, href));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Barre du haut (mobile) */}
      <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
        <Link href={accueil} className="font-semibold">
          CRM-BB
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={deconnexion}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Se déconnecter">
              <LogOut className="size-5" />
            </Button>
          </form>
        </div>
      </header>

      {/* Sidebar (PC) */}
      <aside className="bg-sidebar fixed inset-y-0 left-0 hidden w-60 flex-col border-r p-4 md:flex">
        <Link href={accueil} className="mb-6 px-2 text-lg font-semibold">
          CRM-BB
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {onglets.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                actif(href) && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between gap-2 border-t pt-4">
          <ThemeToggle />
          <form action={deconnexion}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4" /> Quitter
            </Button>
          </form>
        </div>
      </aside>

      {/* Contenu (div, pas <main> : les pages ont déjà leur <main>) */}
      <div
        className={cn(
          "flex-1 md:pb-0 md:pl-60",
          avecOnglets && "pb-[calc(5rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
        {/* Pied de page : la politique de confidentialité reste accessible partout. */}
        <footer className="px-4 py-6 text-center text-xs">
          <Link href="/confidentialite" className="text-muted-foreground underline">
            Confidentialité
          </Link>
        </footer>
      </div>

      {/* Onglets (mobile) — marge safe-area : reste au-dessus de la barre d'accueil iPhone */}
      {avecOnglets ? (
        <nav
          className="bg-background fixed inset-x-0 bottom-0 z-10 grid border-t pb-[env(safe-area-inset-bottom)] md:hidden"
          style={{ gridTemplateColumns: `repeat(${onglets.length}, minmax(0, 1fr))` }}
        >
          {onglets.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs",
                actif(href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
