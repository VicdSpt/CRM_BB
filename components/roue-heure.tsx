"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { HEURES_ROUE, indexAuCentre, minutesRoue } from "@/lib/planning/roue";

// Hauteur d'une ligne (px) : doit correspondre à la classe h-10 des éléments.
const H = 40;

// Choix de l'heure façon réveil de téléphone : deux roues (heures, minutes) qui se calent
// d'elles-mêmes au centre (scroll-snap du navigateur, sans librairie).
export function RoueHeure({ valeur, onChange }: { valeur: string; onChange: (h: string) => void }) {
  const [hh, mm] = valeur.split(":") as [string, string];
  // Liste des minutes figée au premier rendu : une minute hors pas (séance existante)
  // y reste, sans décaler les positions pendant le défilement.
  const [minutes] = useState(() => minutesRoue(mm));

  return (
    <div className="relative flex items-center justify-center gap-1 rounded-lg border py-2">
      {/* Bande qui marque la valeur choisie, derrière les roues. */}
      <div className="bg-muted pointer-events-none absolute inset-x-4 top-1/2 h-10 -translate-y-1/2 rounded-md" />
      <Colonne
        libelle="Heures"
        valeurs={HEURES_ROUE}
        valeur={hh}
        onChange={(h) => onChange(`${h}:${mm}`)}
      />
      <span className="relative pb-1 text-2xl font-semibold">:</span>
      <Colonne
        libelle="Minutes"
        valeurs={minutes}
        valeur={mm}
        onChange={(m) => onChange(`${hh}:${m}`)}
      />
    </div>
  );
}

function Colonne({
  libelle,
  valeurs,
  valeur,
  onChange,
}: {
  libelle: string;
  valeurs: string[];
  valeur: string;
  onChange: (v: string) => void;
}) {
  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined);
  const placee = useRef(false);

  // Une fois le défilement arrêté (et calé par le snap), on retient l'élément du centre.
  const auDefilement = (el: HTMLDivElement) => {
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      const v = valeurs[indexAuCentre(el.scrollTop, H, valeurs.length)];
      if (v && v !== valeur) onChange(v);
    }, 120);
  };

  const allerA = (el: HTMLElement | null, i: number) =>
    el?.scrollTo({ top: Math.min(valeurs.length - 1, Math.max(0, i)) * H, behavior: "smooth" });

  const auClavier = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    allerA(e.currentTarget, valeurs.indexOf(valeur) + (e.key === "ArrowDown" ? 1 : -1));
  };

  return (
    <div
      role="listbox"
      aria-label={libelle}
      tabIndex={0}
      onKeyDown={auClavier}
      onScroll={(e) => auDefilement(e.currentTarget)}
      // Position de départ : la valeur actuelle au centre (une seule fois, au montage).
      ref={(el) => {
        if (!el || placee.current) return;
        el.scrollTop = Math.max(0, valeurs.indexOf(valeur)) * H;
        placee.current = true;
      }}
      className="relative h-50 w-20 snap-y snap-mandatory [scrollbar-width:none] overflow-y-scroll [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_65%,transparent)] py-20 focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
    >
      {valeurs.map((v, i) => (
        <div
          key={v}
          role="option"
          aria-selected={v === valeur}
          onClick={(e) => allerA(e.currentTarget.parentElement, i)}
          className={cn(
            "flex h-10 snap-center items-center justify-center text-xl tabular-nums transition-colors",
            v === valeur ? "text-foreground font-semibold" : "text-muted-foreground",
          )}
        >
          {v}
        </div>
      ))}
    </div>
  );
}
