"use client";

import { useActionState, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inscrireEleve } from "@/lib/eleves/inscription-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Correspondance, JaugeForce, ReglesListe } from "@/components/regles-mot-de-passe";

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
