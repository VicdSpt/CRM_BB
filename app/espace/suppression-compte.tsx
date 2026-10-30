"use client";

import { useActionState } from "react";
import { supprimerMonCompte } from "@/lib/espace/actions";
import { CONFIRMATION_SUPPRESSION } from "@/lib/espace/suppression-compte";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Droit à l'effacement : l'élève supprime lui-même son compte, après avoir tapé
// SUPPRIMER (vérifié aussi côté serveur).
export function SuppressionCompte() {
  const [state, formAction, pending] = useActionState(supprimerMonCompte, {});

  return (
    <section className="mt-10 rounded-lg border border-red-200 p-4 dark:border-red-900">
      <h2 className="font-semibold">Supprimer mon compte</h2>
      <p className="text-muted-foreground mt-1 mb-3 text-sm">
        Tes coordonnées sont effacées et tu ne pourras plus te connecter. Tes réservations à venir
        non payées sont annulées.
      </p>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
          Supprimer mon compte
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ton compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les cours déjà suivis restent dans la comptabilité du
              coach, mais sans ton nom ni tes coordonnées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmation">
                Tape <strong>{CONFIRMATION_SUPPRESSION}</strong> pour confirmer
              </Label>
              <Input id="confirmation" name="confirmation" autoComplete="off" required />
              {state.erreur ? <p className="text-sm text-red-600">{state.erreur}</p> : null}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Suppression…" : "Supprimer mon compte"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
