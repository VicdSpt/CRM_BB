import { Button } from "@/components/ui/button";
import { BoutonSuppression } from "@/components/bouton-suppression";
import { refuserCompte, validerCompte } from "@/lib/eleves/actions";
import { ecartsIdentite } from "@/lib/eleves/inscription";

// Rattachement à une fiche existante : la personne a tapé l'email de cette fiche.
// On montre ce qu'elle a saisi pour que le coach repère une usurpation.
function ControleIdentite({ eleve }: { eleve: EleveAValider }) {
  const ecarts = ecartsIdentite(eleve, {
    prenom: eleve.inscriptionPrenom,
    nom: eleve.inscriptionNom,
    telephone: eleve.inscriptionTelephone,
  });
  return (
    <div className="mt-1 flex flex-col gap-1 text-sm text-amber-600">
      <span>Correspond à une fiche existante — vérifie qu&apos;il s&apos;agit bien de cet élève.</span>
      {ecarts.length === 0 ? (
        <span className="text-muted-foreground">Identité saisie identique à la fiche.</span>
      ) : (
        <ul className="list-disc pl-5">
          {ecarts.map((x) => (
            <li key={x.champ}>
              {x.champ} saisi : <strong>{x.saisie}</strong> (fiche : {x.fiche})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type EleveAValider = {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  creeParInscription: boolean;
  inscriptionPrenom: string | null;
  inscriptionNom: string | null;
  inscriptionTelephone: string | null;
};

// Section en tête de « Élèves » : comptes créés par les élèves, en attente du coach.
export function ElevesAValider({ eleves }: { eleves: EleveAValider[] }) {
  if (eleves.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold">À valider ({eleves.length})</h2>
      <ul className="flex flex-col gap-2">
        {eleves.map((e) => (
          <li key={e.id} className="flex flex-col gap-2 rounded-lg border border-amber-500/50 p-3">
            <div className="flex flex-col">
              <span className="font-medium">
                {e.prenom} {e.nom}
              </span>
              {e.email ? <span className="text-muted-foreground text-sm">{e.email}</span> : null}
              {e.telephone ? (
                <span className="text-muted-foreground text-sm">{e.telephone}</span>
              ) : null}
              {!e.creeParInscription ? <ControleIdentite eleve={e} /> : null}
            </div>
            <div className="flex gap-2">
              <form action={validerCompte.bind(null, e.id)} className="flex-1">
                <Button type="submit" size="sm" className="w-full">
                  Valider
                </Button>
              </form>
              <BoutonSuppression
                action={refuserCompte.bind(null, e.id)}
                titre="Refuser cette inscription ?"
                description={
                  e.creeParInscription
                    ? "Le compte et sa fiche seront supprimés."
                    : "Le compte sera retiré ; la fiche existante de l'élève est conservée."
                }
                label="Refuser"
                size="sm"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
