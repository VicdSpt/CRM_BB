"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Bouton destructif qui ouvre une modale de confirmation avant d'exécuter
// une Server Action — remplace les confirm() natifs du navigateur.
export function BoutonSuppression({
  action,
  titre,
  description,
  label = "Supprimer",
  size = "default",
}: {
  action: () => void | Promise<void>;
  titre: string;
  description: string;
  label?: string;
  size?: "default" | "sm";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size={size} />}>
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titre}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <form action={action}>
            <AlertDialogAction type="submit" variant="destructive" className="w-full">
              {label}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
