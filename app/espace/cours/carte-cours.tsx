"use client";

import { useState, useTransition } from "react";
import type { EtatCours } from "@/lib/espace/regles";
import { annulerReservation, reserverCours } from "@/lib/espace/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CarteCoursProps = {
  id: string;
  heure: string;
  dureeMinutes: number;
  lieu: string | null;
  prix: string;
  etat: EtatCours;
  nbInscrits: number;
  capacite: number;
};

const PASTILLES: Partial<Record<EtatCours, { texte: string; classe: string }>> = {
  inscrit: {
    texte: "Inscrit ✓",
    classe: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  inscrit_verrouille: {
    texte: "Inscrit ✓",
    classe: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  complet: { texte: "Complet", classe: "bg-red-500/15 text-red-700 dark:text-red-400" },
  annule: { texte: "Annulé", classe: "bg-muted text-muted-foreground" },
};

export function CarteCours(c: CarteCoursProps) {
  const [erreur, setErreur] = useState<string>();
  const [pending, startTransition] = useTransition();

  const lancer = (action: (id: string) => Promise<{ erreur?: string }>) =>
    startTransition(async () => {
      const resultat = await action(c.id);
      setErreur(resultat.erreur);
    });

  const pastille = PASTILLES[c.etat] ?? {
    texte: `${c.nbInscrits} / ${c.capacite} places`,
    classe: "bg-muted text-foreground",
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">
          {c.heure} · {c.dureeMinutes} min
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs", pastille.classe)}>
          {pastille.texte}
        </span>
      </div>
      <span className="text-muted-foreground text-sm">
        {[c.lieu, c.prix].filter(Boolean).join(" · ")}
      </span>

      {c.etat === "disponible" ? (
        <Button disabled={pending} onClick={() => lancer(reserverCours)}>
          {pending ? "Inscription…" : "M'inscrire"}
        </Button>
      ) : null}
      {c.etat === "complet" ? <Button disabled>Complet</Button> : null}
      {c.etat === "inscrit" ? (
        <Button variant="outline" disabled={pending} onClick={() => lancer(annulerReservation)}>
          {pending ? "Désinscription…" : "Me désinscrire"}
        </Button>
      ) : null}
      {c.etat === "inscrit_verrouille" ? (
        <p className="text-muted-foreground text-xs">
          Moins de 24 h avant le cours : contacte ton coach pour te désinscrire.
        </p>
      ) : null}

      {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}
    </li>
  );
}
