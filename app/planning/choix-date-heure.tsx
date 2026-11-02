"use client";

import { useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RoueHeure } from "@/components/roue-heure";
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

// Mobile = sous le point de rupture md de Tailwind (768 px), comme le reste de l'app.
const MEDIA_MOBILE = "(max-width: 767px)";
const abonnementMobile = (rappel: () => void) => {
  const m = window.matchMedia(MEDIA_MOBILE);
  m.addEventListener("change", rappel);
  return () => m.removeEventListener("change", rappel);
};
const estMobile = () => window.matchMedia(MEDIA_MOBILE).matches;

// Une roue affiche toujours une valeur : sans heure choisie, elle part de 08:00.
const HEURE_ROUE_PAR_DEFAUT = "08:00";

// Date et heure d'une séance : un calendrier du mois, puis l'heure : roue façon réveil sur
// mobile, menu déroulant (par demi-heure) sur ordinateur.
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
  // Ordinateur au rendu serveur, puis selon la largeur réelle de l'écran.
  const mobile = useSyncExternalStore(abonnementMobile, estMobile, () => false);
  // Sur mobile, l'heure affichée par la roue compte comme choisie.
  const heureChoisie = heure ?? (mobile ? HEURE_ROUE_PAR_DEFAUT : null);
  const depart = date ? new Date(`${date}T12:00`) : new Date();
  const [mois, setMois] = useState({ annee: depart.getFullYear(), mois: depart.getMonth() });

  const changerMois = (delta: number) => {
    const d = new Date(mois.annee, mois.mois + delta, 1);
    setMois({ annee: d.getFullYear(), mois: d.getMonth() });
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="hidden"
        name={name}
        value={date && heureChoisie ? `${date}T${heureChoisie}` : ""}
      />

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

      {/* Heure : roue sur mobile ; sur ordinateur, menu par demi-heure (une heure hors
          grille d'une séance existante reste proposée). */}
      {mobile ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Heure</span>
          <RoueHeure valeur={heureChoisie ?? HEURE_ROUE_PAR_DEFAUT} onChange={setHeure} />
        </div>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Heure</span>
          <span className="relative">
            <Clock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <select
              value={heure ?? ""}
              onChange={(e) => setHeure(e.target.value || null)}
              className="bg-background text-foreground h-9 w-full rounded-md border pr-3 pl-9 text-sm tabular-nums"
            >
              <option value="" disabled>
                Choisir une heure
              </option>
              {(heure && !CRENEAUX.includes(heure) ? [heure, ...CRENEAUX].sort() : CRENEAUX).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </span>
        </label>
      )}

      {/* Récapitulatif */}
      <p
        className={cn(
          "rounded-md px-3 py-2 text-sm",
          date && heureChoisie ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground",
        )}
      >
        {date ? libelleDateHeure(date, heureChoisie) : "Choisis un jour puis une heure."}
        {date && !heureChoisie ? " — choisis une heure." : null}
      </p>
      {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}
    </div>
  );
}
