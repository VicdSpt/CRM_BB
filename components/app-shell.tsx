"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, LogOut, Users, Wallet } from "lucide-react";
import { isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { deconnexion } from "@/app/actions/session";

const ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/planning", label: "Planning", icon: CalendarDays },
  { href: "/eleves", label: "Élèves", icon: Users },
  { href: "/finances", label: "Finances", icon: Wallet },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // La page de connexion reste hors coquille.
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Barre du haut (mobile) */}
      <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
        <Link href="/" className="font-semibold">
          CRM-BB
        </Link>
        <ThemeToggle />
      </header>

      {/* Sidebar (PC) */}
      <aside className="bg-sidebar fixed inset-y-0 left-0 hidden w-60 flex-col border-r p-4 md:flex">
        <Link href="/" className="mb-6 px-2 text-lg font-semibold">
          CRM-BB
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, href) && "bg-primary/10 text-primary",
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
      <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-60">
        {children}
      </div>

      {/* Onglets (mobile) — pb-[env(...)] : reste au-dessus de la barre d'accueil iPhone */}
      <nav className="bg-background fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] md:hidden">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-xs",
              isActive(pathname, href) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
