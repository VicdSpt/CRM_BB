"use client";

import { Check, X } from "lucide-react";
import {
  forceMotDePasse,
  LIBELLES_REGLES,
  reglesMotDePasse,
  type ReglesMotDePasse,
} from "@/lib/auth/force-mot-de-passe";
import { cn } from "@/lib/utils";

// Aides visuelles à la saisie d'un mot de passe (inscription élève, profil coach).

const NIVEAUX = [
  { libelle: "", couleur: "" },
  { libelle: "Faible", couleur: "bg-red-500" },
  { libelle: "Moyen", couleur: "bg-amber-500" },
  { libelle: "Bon", couleur: "bg-lime-500" },
  { libelle: "Fort", couleur: "bg-emerald-500" },
] as const;

// Jauge en 4 segments : faible, moyen, bon, fort.
export function JaugeForce({ motDePasse }: { motDePasse: string }) {
  const niveau = forceMotDePasse(motDePasse);
  const { libelle, couleur } = NIVEAUX[niveau];
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= niveau ? couleur : "bg-muted",
            )}
          />
        ))}
      </div>
      <span className="text-muted-foreground min-w-24 text-right text-xs">
        {libelle ? "Force : " : ""}
        <span className="text-foreground font-medium">{libelle}</span>
      </span>
    </div>
  );
}

// Les règles se cochent pendant la saisie.
export function ReglesListe({ motDePasse }: { motDePasse: string }) {
  const regles = reglesMotDePasse(motDePasse);
  return (
    <ul id="regles-mdp" className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
      {(Object.keys(LIBELLES_REGLES) as (keyof ReglesMotDePasse)[]).map((r) => (
        <li
          key={r}
          className={cn(
            "flex items-center gap-1.5",
            regles[r] ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
          )}
        >
          {regles[r] ? <Check className="size-3.5" /> : <X className="size-3.5" />}
          <span>
            {LIBELLES_REGLES[r].charAt(0).toUpperCase() + LIBELLES_REGLES[r].slice(1)}
            <span className="sr-only">{regles[r] ? " : respecté" : " : manquant"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Correspondance({
  motDePasse,
  confirmation,
}: {
  motDePasse: string;
  confirmation: string;
}) {
  if (!confirmation) return null;
  const ok = confirmation === motDePasse;
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs",
        ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600",
      )}
      aria-live="polite"
    >
      {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      {ok ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas."}
    </p>
  );
}
