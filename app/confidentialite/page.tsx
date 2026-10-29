import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Confidentialité" };

// Politique de confidentialité (RGPD), ouverte à tous. Le responsable du traitement
// est le coach : son nom et son email sont lus en base, jamais écrits dans le code.
export default async function ConfidentialitePage() {
  const coach = await prisma.coach.findFirst({ select: { nom: true, email: true } });
  const responsable = coach?.nom ?? "le coach";

  return (
    <main className="mx-auto w-full max-w-2xl p-4 pb-16">
      {/* « / » renvoie chacun vers son accueil (connexion, espace élève ou tableau de bord). */}
      <Link href="/" className="text-primary text-sm underline">
        ← Retour
      </Link>
      <h1 className="mt-4 mb-1 text-2xl font-semibold">Politique de confidentialité</h1>
      <p className="text-muted-foreground mb-8 text-sm">Dernière mise à jour : 29 octobre 2026</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
        <section>
          <h2>Qui s&apos;occupe de tes données ?</h2>
          <p>
            Ce site sert à la gestion des cours de boxe de {responsable}, responsable du traitement
            de tes données.
            {coach ? (
              <>
                {" "}
                Pour toute question :{" "}
                <a href={`mailto:${coach.email}`} className="text-primary underline">
                  {coach.email}
                </a>
                .
              </>
            ) : null}
          </p>
        </section>

        <section>
          <h2>Quelles données ?</h2>
          <ul>
            <li>Ton identité : prénom et nom.</li>
            <li>Tes coordonnées : email, téléphone et, si tu la donnes, ton adresse.</li>
            <li>
              Ton mot de passe, jamais conservé en clair : seule une empreinte chiffrée irréversible
              est enregistrée.
            </li>
            <li>
              Tes cours : réservations, séances suivies, packs et paiements (montant, date, moyen).
            </li>
            <li>Les notes de suivi que le coach peut ajouter sur ta fiche.</li>
            <li>
              Pour la sécurité : les tentatives de connexion ratées (email et empreinte de
              l&apos;adresse IP, jamais l&apos;adresse elle-même), effacées après 24 heures.
            </li>
          </ul>
        </section>

        <section>
          <h2>Pourquoi ?</h2>
          <ul>
            <li>Gérer tes réservations, tes cours et tes paiements (exécution de tes cours).</li>
            <li>Protéger les comptes contre les intrusions (intérêt légitime).</li>
            <li>Tenir la comptabilité du coach (obligation légale).</li>
          </ul>
          <p className="mt-2">
            Tes données ne sont ni vendues, ni utilisées pour de la publicité, ni pour du suivi de
            navigation.
          </p>
        </section>

        <section>
          <h2>Qui y a accès ?</h2>
          <p>
            Uniquement le coach. Le site est hébergé par Vercel et la base de données par Neon, qui
            stockent les données pour son compte sans les utiliser. Si tu te connectes avec Google,
            Google confirme seulement ton adresse email au site.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            Un seul cookie, indispensable : celui qui te garde connecté (7 jours au maximum). Ton
            choix de thème clair ou sombre est retenu dans ton navigateur. Aucun cookie de mesure
            d&apos;audience ni de publicité.
          </p>
        </section>

        <section>
          <h2>Combien de temps ?</h2>
          <p>
            Tant que ton compte existe. Si tu le supprimes, tes coordonnées sont effacées. Les cours
            et paiements déjà enregistrés restent dans la comptabilité du coach, mais sans ton nom
            ni tes coordonnées.
          </p>
        </section>

        <section>
          <h2>Tes droits</h2>
          <ul>
            <li>Voir et corriger tes coordonnées : depuis ton profil.</li>
            <li>Supprimer ton compte : bouton « Supprimer mon compte » dans ton profil.</li>
            <li>
              Obtenir une copie de tes données, t&apos;opposer à un traitement ou poser une question
              : en écrivant au coach.
            </li>
            <li>
              Introduire une réclamation auprès de l&apos;Autorité de protection des données
              (Belgique).
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
