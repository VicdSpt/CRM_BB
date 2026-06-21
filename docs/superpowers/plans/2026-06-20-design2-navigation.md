# Design 2 — Coquille de navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à l'app une vraie navigation persistante : **barre d'onglets en bas sur mobile** + **barre latérale sur PC** + une fine barre du haut (mobile), avec la **bascule de thème** intégrée et la **déconnexion**. La page de connexion reste hors coquille.

**Architecture:** Un composant client `AppShell` enveloppe les pages dans le layout racine ; via `usePathname()` il affiche la coquille partout **sauf** sur `/login`, et met en évidence la section active. La déconnexion passe par une Server Action dédiée. La logique métier n'est pas touchée.

**Tech Stack:** Next.js 16 (App Router), Tailwind v4, shadcn/ui, `lucide-react`, `next-themes` (déjà en place).

## Global Constraints

- Périmètre **présentation/navigation uniquement** : aucune logique métier, sécurité ou calcul modifié.
- 4 sections : **Accueil `/` · Planning `/planning` · Élèves `/eleves` · Finances `/finances`**. Section active en **corail** (`text-primary`).
- Mobile : onglets en bas (toujours visibles) + barre du haut (nom + bascule thème). PC : sidebar gauche (sections + bascule thème + déconnexion).
- La page **`/login`** est rendue **sans** la coquille.
- Build vert, lint propre, **tests existants au vert** ; un test unitaire pour le helper `isActive` (TDD).
- Git : branche `feat/design-navigation` (déjà active), commits petits, jamais de push direct sur `main`.
- Environnement : Windows, shell PowerShell. `Button` = base-ui (pas de `asChild`).

---

### Task 1 : Helper d'onglet actif (TDD)

**Files:**

- Create: `lib/nav.ts`, `lib/nav.test.ts`

**Interfaces:**

- Produces: `isActive(pathname: string, href: string): boolean` — `true` si `href` correspond à la section courante. `/` ne correspond qu'à l'accueil exact ; les autres correspondent au préfixe (ex. `/eleves/123` → `/eleves`).

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/nav.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { isActive } from "./nav";

describe("isActive", () => {
  it("accueil actif uniquement sur la racine exacte", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/planning", "/")).toBe(false);
  });

  it("section active sur l'URL exacte", () => {
    expect(isActive("/eleves", "/eleves")).toBe(true);
  });

  it("section active sur une sous-page", () => {
    expect(isActive("/eleves/123", "/eleves")).toBe(true);
    expect(isActive("/eleves/123/modifier", "/eleves")).toBe(true);
  });

  it("section inactive pour une autre section", () => {
    expect(isActive("/planning", "/eleves")).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/nav.test.ts
```

Expected : ÉCHEC — `Cannot find module './nav'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/nav.ts` :

```typescript
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/nav.test.ts
```

Expected : SUCCÈS — 4 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/nav.ts lib/nav.test.ts
git commit -m "feat(design): helper isActive pour la navigation (TDD)"
```

---

### Task 2 : Déconnexion (Server Action) + bascule de thème durcie

**Files:**

- Create: `app/actions/session.ts`
- Modify: `components/theme-toggle.tsx` (placeholder avant montage)

**Interfaces:**

- Produces: `deconnexion(): Promise<void>` — Server Action qui déconnecte et redirige vers `/login`. `ThemeToggle` n'affiche plus d'icône erronée avant l'hydratation.

- [ ] **Step 1: Créer la Server Action de déconnexion**

Créer `app/actions/session.ts` :

```typescript
"use server";

import { signOut } from "@/auth";

export async function deconnexion(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
```

- [ ] **Step 2: Durcir la bascule de thème (éviter le flash d'icône)**

Remplacer le contenu de `components/theme-toggle.tsx` par :

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [monte, setMonte] = useState(false);

  useEffect(() => setMonte(true), []);

  const estSombre = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={estSombre ? "Passer en clair" : "Passer en sombre"}
      onClick={() => setTheme(estSombre ? "light" : "dark")}
    >
      {monte ? (
        estSombre ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        <span className="size-4" />
      )}
    </Button>
  );
}
```

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Commit**

```bash
git add app/actions/session.ts components/theme-toggle.tsx
git commit -m "feat(design): action de déconnexion + bascule de thème sans flash"
```

---

### Task 3 : Coquille de navigation (AppShell) + intégration

**Files:**

- Create: `components/app-shell.tsx`
- Modify: `app/layout.tsx` (envelopper les enfants dans `AppShell`)
- Modify: `app/page.tsx` (retirer la bascule de thème temporaire — désormais dans la coquille)

**Interfaces:**

- Consumes: `isActive` (`@/lib/nav`), `ThemeToggle`, `deconnexion` (`@/app/actions/session`), `cn` (`@/lib/utils`), icônes lucide.
- Produces: `AppShell` — composant client qui rend la coquille (sidebar PC / onglets mobile / barre du haut) autour de `{children}`, sauf sur `/login`.

- [ ] **Step 1: Créer le composant AppShell**

Créer `components/app-shell.tsx` :

```tsx
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
      <div className="flex-1 pb-20 md:pb-0 md:pl-60">{children}</div>

      {/* Onglets (mobile) */}
      <nav className="bg-background fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t md:hidden">
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
```

- [ ] **Step 2: Envelopper les pages dans AppShell (layout)**

Dans `app/layout.tsx` :

1. Ajouter l'import :

```tsx
import { AppShell } from "@/components/app-shell";
```

2. Remplacer `{children}` (à l'intérieur de `<ThemeProvider>`) par :

```tsx
<AppShell>{children}</AppShell>
```

- [ ] **Step 3: Retirer la bascule de thème temporaire de l'accueil**

Dans `app/page.tsx` :

1. Supprimer l'import `import { ThemeToggle } from "@/components/theme-toggle";`.
2. Supprimer la ligne `<ThemeToggle />` (placée provisoirement en Task 5 de Design 1). Conserver le reste de la page inchangé.

- [ ] **Step 4: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 5: Test manuel CLI**

Run :

```bash
npm run dev
```

Vérifier (non authentifié) : `GET /login` s'affiche **sans** la coquille (pas d'onglets/sidebar). Une fois connecté, la navigation (onglets en bas sur mobile / sidebar sur PC) est présente, la section active est en corail, et `/login` reste épuré. Arrêter le serveur. (Si le dev server est lent, le build suffit comme signal principal.)

- [ ] **Step 6: Commit**

```bash
git add components/app-shell.tsx app/layout.tsx app/page.tsx
git commit -m "feat(design): coquille de navigation (sidebar PC + onglets mobile)"
```

---

### Task 4 : Vérification finale + changelog

**Files:**

- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: Lint, tests, build**

Run :

```bash
npm run lint && npm run test:run && npm run build
```

Expected : lint propre, tous les tests passent (dont `isActive`), build réussi.

- [ ] **Step 2: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-20 — Design 2 : Coquille de navigation

- Navigation persistante : onglets en bas (mobile) + barre latérale (PC) + barre du haut.
- Section active en corail ; bascule de thème et déconnexion intégrées ; page de connexion hors coquille.
```

- [ ] **Step 3: Formater et committer**

Run :

```bash
npm run format
```

Puis :

```bash
git add docs/historique/CHANGELOG.md
git commit -m "docs: changelog design 2 (navigation)"
```

(Inclure d'éventuels composants shadcn reformatés.)

La sous-phase 2 est terminée : l'app a une vraie navigation adaptative. Fusion de
`feat/design-navigation` vers `main` via PR après tests. (Suivra : Design 3, l'accueil.)

---

## Self-Review

- **Couverture spec §3 (navigation)** : onglets mobile + sidebar PC + barre du haut (T3), section active corail via `isActive` (T1), bascule thème + déconnexion intégrées (T2 + T3), `/login` hors coquille (T3).
- **Dette Design 1 levée** : `ThemeToggle` ne montre plus d'icône erronée avant montage (T2).
- **Périmètre présentation** : aucune logique métier touchée ; seuls layout, composants UI et une Server Action de déconnexion (qui délègue à `signOut` existant).
- **Tests** : `isActive` en TDD (T1) ; suite existante conservée verte (T4).
- **Placeholders** : aucun — code complet à chaque étape.
- **Cohérence des types** : `isActive` (T1) consommé par `AppShell` (T3) ; `deconnexion` (T2) consommée par `AppShell` (T3) ; `ThemeToggle` (T2) consommée par `AppShell` (T3).
- **Note `<main>`** : la coquille utilise un `<div>` conteneur (pas `<main>`) car chaque page rend déjà son propre `<main>` — évite un `<main>` imbriqué.
