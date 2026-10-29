"use client";

import { useActionState, useState, type ComponentProps } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { inscrireEleve } from "@/lib/eleves/inscription-actions";
import {
  forceMotDePasse,
  LIBELLES_REGLES,
  reglesMotDePasse,
  type ReglesMotDePasse,
} from "@/lib/auth/force-mot-de-passe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const NIVEAUX = [
  { libelle: "", couleur: "" },
  { libelle: "Faible", couleur: "bg-red-500" },
  { libelle: "Moyen", couleur: "bg-amber-500" },
  { libelle: "Bon", couleur: "bg-lime-500" },
  { libelle: "Fort", couleur: "bg-emerald-500" },
] as const;

type Champs = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  confirmation: string;
};

export function InscriptionForm() {
  const [state, formAction, pending] = useActionState(inscrireEleve, {});
  // Champs contrôlés : leur contenu reste affiché si le serveur renvoie une erreur.
  const [champs, setChamps] = useState<Champs>({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    motDePasse: "",
    confirmation: "",
  });
  const [visible, setVisible] = useState(false);
  const maj = (nom: keyof Champs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setChamps((c) => ({ ...c, [nom]: e.target.value }));

  const erreur = (nom: keyof Champs) =>
    state.errors?.[nom] ? <p className="text-sm text-red-600">{state.errors[nom]}</p> : null;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ
          label="Prénom"
          name="prenom"
          autoComplete="given-name"
          value={champs.prenom}
          onChange={maj("prenom")}
        >
          {erreur("prenom")}
        </Champ>
        <Champ
          label="Nom"
          name="nom"
          autoComplete="family-name"
          value={champs.nom}
          onChange={maj("nom")}
        >
          {erreur("nom")}
        </Champ>
      </div>
      <Champ
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={champs.email}
        onChange={maj("email")}
      >
        {erreur("email")}
      </Champ>
      <Champ
        label="Téléphone"
        name="telephone"
        type="tel"
        autoComplete="tel"
        value={champs.telephone}
        onChange={maj("telephone")}
      >
        {erreur("telephone")}
      </Champ>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="motDePasse">Mot de passe</Label>
        <div className="relative">
          <Input
            id="motDePasse"
            name="motDePasse"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            value={champs.motDePasse}
            onChange={maj("motDePasse")}
            aria-describedby="regles-mdp"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={visible}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md focus-visible:ring-2 focus-visible:outline-none"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <JaugeForce motDePasse={champs.motDePasse} />
        <ReglesListe motDePasse={champs.motDePasse} />
        {erreur("motDePasse")}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
        <Input
          id="confirmation"
          name="confirmation"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={champs.confirmation}
          onChange={maj("confirmation")}
        />
        <Correspondance motDePasse={champs.motDePasse} confirmation={champs.confirmation} />
        {erreur("confirmation")}
      </div>

      {state.message ? <p className="text-sm">{state.message}</p> : null}
      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}

function Champ({
  label,
  name,
  children,
  ...props
}: { label: string; name: string; children?: React.ReactNode } & ComponentProps<typeof Input>) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
      {children}
    </div>
  );
}

// Jauge en 4 segments : faible, moyen, bon, fort.
function JaugeForce({ motDePasse }: { motDePasse: string }) {
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
function ReglesListe({ motDePasse }: { motDePasse: string }) {
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

function Correspondance({
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
