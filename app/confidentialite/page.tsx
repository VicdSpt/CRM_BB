import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Confidentialité" };

// Politique de confidentialité (RGPD), ouverte à tous, en termes simples et sans nom.
// Le site est géré par son administrateur ; l'email de contact vient d'une variable
// d'environnement (jamais écrit dans le dépôt public). Sans elle, on renvoie au coach.
export default async function ConfidentialitePage() {
  // Lue à la requête : changer la variable sur Vercel suffit, sans rebuild.
  await connection();
  const email = process.env.CONTACT_EMAIL?.trim() || null;
  const contact = email ? (
    <a href={`mailto:${email}`} className="text-primary underline">
      {email}
    </a>
  ) : (
    "demande au coach, qui transmettra"
  );

  return (
    <main className="mx-auto w-full max-w-2xl p-4 pb-16">
      {/* « / » renvoie chacun vers son accueil (connexion, espace élève ou tableau de bord). */}
      <Link href="/" className="text-primary text-sm underline">
        ← Retour
      </Link>
      <h1 className="mt-4 mb-1 text-2xl font-semibold">Politique de confidentialité</h1>
      <p className="text-muted-foreground mb-6 text-sm">Dernière mise à jour : 30 octobre 2026</p>

      <p className="bg-muted mb-8 rounded-md p-4 text-sm leading-relaxed">
        <strong>En bref :</strong> on garde seulement ce qu&apos;il faut pour gérer tes cours. Rien
        n&apos;est vendu, ni utilisé pour de la publicité.
      </p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
        <section>
          <h2>Qui gère tes données ?</h2>
          <p>
            L&apos;administrateur de ce site, qui sert à organiser les cours de boxe du coach. Une
            question ? {contact}.
          </p>
        </section>

        <section>
          <h2>Ce qu&apos;on garde</h2>
          <ul>
            <li>Ton nom, ton email, ton téléphone et ton adresse si tu la donnes.</li>
            <li>Ton mot de passe, sous une forme illisible : personne ne peut le lire.</li>
            <li>Tes réservations, tes cours, tes packs et tes paiements.</li>
            <li>Les notes que le coach ajoute sur ta fiche.</li>
            <li>Les connexions ratées, pour bloquer les intrus (effacées après 24 heures).</li>
          </ul>
        </section>

        <section>
          <h2>Pourquoi ?</h2>
          <ul>
            <li>Organiser tes cours et suivre tes paiements.</li>
            <li>Protéger ton compte.</li>
            <li>Tenir la comptabilité du coach, comme la loi l&apos;exige.</li>
          </ul>
        </section>

        <section>
          <h2>Qui y a accès ?</h2>
          <ul>
            <li>L&apos;administrateur du site, pour le faire fonctionner.</li>
            <li>Le coach, pour ce qui concerne tes cours.</li>
            <li>
              Les hébergeurs (Vercel pour le site, Neon pour les données), qui les stockent sans les
              utiliser.
            </li>
          </ul>
          <p className="mt-2">
            Si tu te connectes avec Google, Google nous confirme seulement ton email.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            Un seul, pour rester connecté (7 jours au maximum). Pas de pub, pas de statistiques.
          </p>
        </section>

        <section>
          <h2>Combien de temps ?</h2>
          <p>
            Tant que tu as un compte. Si tu le supprimes, ton nom et tes coordonnées sont effacés.
            Les paiements passés restent dans les comptes du coach, sans ton nom.
          </p>
        </section>

        <section>
          <h2>Tes droits</h2>
          <ul>
            <li>Modifier tes informations : dans ton profil.</li>
            <li>Supprimer ton compte : bouton « Supprimer mon compte », dans ton profil.</li>
            <li>Recevoir une copie de tes données ou poser une question : {contact}.</li>
            <li>
              Te plaindre auprès de l&apos;
              <a
                href="https://www.autoriteprotectiondonnees.be"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Autorité de protection des données
              </a>{" "}
              (Belgique).
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
