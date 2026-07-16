"use client";

import { setArchiveEleve, deleteEleve } from "@/lib/eleves/actions";
import { Button } from "@/components/ui/button";
import { BoutonSuppression } from "@/components/bouton-suppression";

export function ActionsEleve({
  id,
  archive,
  peutSupprimer,
}: {
  id: string;
  archive: boolean;
  peutSupprimer: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={() => setArchiveEleve(id, !archive)}>
        <Button type="submit" variant="outline">
          {archive ? "Désarchiver" : "Archiver"}
        </Button>
      </form>
      {peutSupprimer ? (
        <BoutonSuppression
          action={() => deleteEleve(id)}
          titre="Supprimer cet élève ?"
          description="Cette action est irréversible : l'élève sera définitivement supprimé."
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          Suppression impossible : l&apos;élève a un historique. Archivez-le.
        </p>
      )}
    </div>
  );
}
