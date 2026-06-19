"use client";

import { setArchiveEleve, deleteEleve } from "@/lib/eleves/actions";
import { Button } from "@/components/ui/button";

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
        <form
          action={() => deleteEleve(id)}
          onSubmit={(e) => {
            if (!confirm("Supprimer définitivement cet élève ? Cette action est irréversible.")) {
              e.preventDefault();
            }
          }}
        >
          <Button type="submit" variant="destructive">
            Supprimer
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground text-sm">
          Suppression impossible : l&apos;élève a un historique. Archivez-le.
        </p>
      )}
    </div>
  );
}
