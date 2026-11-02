"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { changerMotDePasseCoach } from "@/lib/coach/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Correspondance, JaugeForce, ReglesListe } from "@/components/regles-mot-de-passe";

const VIDE = { actuel: "", nouveau: "", confirmation: "" };

// Changement du mot de passe du coach : actuel, puis nouveau (mêmes règles que les élèves).
export function MotDePasseForm() {
  const [state, formAction, pending] = useActionState(changerMotDePasseCoach, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* « ok » change à chaque succès : les champs repartent à zéro. */}
      <Champs key={state.ok ?? 0} errors={state.errors} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Modification…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}

function Champs({ errors }: { errors?: Record<string, string> }) {
  const [champs, setChamps] = useState(VIDE);
  const [visible, setVisible] = useState(false);

  const maj = (cle: keyof typeof VIDE) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setChamps((c) => ({ ...c, [cle]: e.target.value }));
  const erreur = (cle: string) =>
    errors?.[cle] ? <p className="text-sm text-red-600">{errors[cle]}</p> : null;
  const type = visible ? "text" : "password";

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="actuel">Mot de passe actuel</Label>
        <Input
          id="actuel"
          name="actuel"
          type={type}
          autoComplete="current-password"
          value={champs.actuel}
          onChange={maj("actuel")}
        />
        {erreur("actuel")}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nouveau">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="nouveau"
            name="nouveau"
            type={type}
            autoComplete="new-password"
            value={champs.nouveau}
            onChange={maj("nouveau")}
            aria-describedby="regles-mdp"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer les mots de passe" : "Afficher les mots de passe"}
            aria-pressed={visible}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md focus-visible:ring-2 focus-visible:outline-none"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <JaugeForce motDePasse={champs.nouveau} />
        <ReglesListe motDePasse={champs.nouveau} />
        {erreur("nouveau")}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmation">Confirmer le nouveau mot de passe</Label>
        <Input
          id="confirmation"
          name="confirmation"
          type={type}
          autoComplete="new-password"
          value={champs.confirmation}
          onChange={maj("confirmation")}
        />
        <Correspondance motDePasse={champs.nouveau} confirmation={champs.confirmation} />
        {erreur("confirmation")}
      </div>
    </>
  );
}
