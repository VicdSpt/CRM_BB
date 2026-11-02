"use client";

import { useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  creneauxHoraires,
  grilleMois,
  isoJour,
  libelleDateHeure,
  separerDateHeure,
} from "@/lib/planning/calendrier";

const JOURS = ["lu", "ma", "me", "je", "ve", "sa", "di"];
const CRENEAUX = creneauxHoraires("06:00", "22:00", 30);
const MOIS = new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric" });

const isoAujourdhui = () => {
  const d = new Date();
  return isoJour(d.getFullYear(), d.getMonth(), d.getDate());
};
const sansAbonnement = () => () => {};

// Date et heure d'une séance : un calendrier du mois, puis un créneau (ou une heure libre).
// Envoie « dateHeureDebut » au format datetime-local, comme l'ancien champ natif.
export function ChoixDateHeure({
  name,
  valeurInitiale,
  erreur,
}: {
  name: string;
  valeurInitiale?: string;
  erreur?: string;
}) {
  const initial = separerDateHeure(valeurInitiale);
  const [date, setDate] = useState(initial.date);
  const [heure, setHeure] = useState(initial.heure);
  // « Aujourd'hui » selon le navigateur (le serveur est en UTC) : null au rendu serveur.
  const iso = useSyncExternalStore(sansAbonnement, isoAujourdhui, () => null);
  const depart = date ? new Date(`${date}T12:00`) : new Date();
  const [mois, setMois] = useState({ annee: depart.getFullYear(), mois: depart.getMonth() });

  const changerMois = (delta: number) => {
    const d = new Date(mois.annee, mois.mois + delta, 1);
    setMois({ annee: d.getFullYear(), mois: d.getMonth() });
  };

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name={name} value={date && heure ? `${date}T${heure}` : ""} />

      {/* Calendrier */}
      <div className="rounded-lg border p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mois précédent"
            onClick={() => changerMois(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium capitalize">
            {MOIS.format(new Date(mois.annee, mois.mois, 1))}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mois suivant"
            onClick={() => changerMois(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="text-muted-foreground grid grid-cols-7 text-center text-xs">
          {JOURS.map((j) => (
            <span key={j} className="py-1">
              {j}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grilleMois(mois.annee, mois.mois)
            .flat()
            .map((jour, i) =>
              jour ? (
                <button
                  key={jour}
                  type="button"
                  onClick={() => setDate(jour)}
                  aria-pressed={jour === date}
                  aria-label={libelleDateHeure(jour, null)}
                  className={cn(
                    "hover:bg-muted flex aspect-square items-center justify-center rounded-md text-sm tabular-nums transition-colors",
                    iso && jour < iso && "text-muted-foreground/60",
                    jour === iso && "ring-primary/60 ring-1",
                    jour === date && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {Number(jour.slice(8))}
                </button>
              ) : (
                <span key={`vide-${i}`} />
              ),
            )}
        </div>
      </div>

      {/* Créneaux */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Heure</span>
        <div className="grid max-h-48 grid-cols-4 gap-1.5 overflow-y-auto pr-1">
          {CRENEAUX.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setHeure(c)}
              aria-pressed={c === heure}
              className={cn(
                "hover:bg-muted rounded-md border py-1.5 text-sm tabular-nums transition-colors",
                c === heure && "bg-primary text-primary-foreground border-primary hover:bg-primary",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          Autre heure
          <Input
            type="time"
            value={heure ?? ""}
            onChange={(e) => setHeure(e.target.value || null)}
            className="w-32"
          />
        </label>
      </div>

      {/* Récapitulatif */}
      <p
        className={cn(
          "rounded-md px-3 py-2 text-sm",
          date && heure ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground",
        )}
      >
        {date ? libelleDateHeure(date, heure) : "Choisis un jour puis une heure."}
        {date && !heure ? " — choisis une heure." : null}
      </p>
      {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}
    </div>
  );
}
