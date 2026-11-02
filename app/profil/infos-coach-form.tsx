"use client";

import { useActionState } from "react";
import { modifierInfosCoach } from "@/lib/coach/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Nom et email de connexion du coach.
export function InfosCoachForm({ nom, email }: { nom: string; email: string }) {
  const [state, formAction, pending] = useActionState(modifierInfosCoach, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nom">Nom</Label>
        <Input id="nom" name="nom" defaultValue={nom} autoComplete="name" required />
        {state.errors?.nom ? <p className="text-sm text-red-600">{state.errors.nom}</p> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email de connexion</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          autoComplete="email"
          required
        />
        {state.errors?.email ? (
          <p className="text-sm text-red-600">{state.errors.email}</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            C&apos;est l&apos;adresse à utiliser pour te connecter.
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
