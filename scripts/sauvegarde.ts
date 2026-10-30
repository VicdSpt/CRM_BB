// Sauvegarde complète de la base dans un fichier JSON daté (dossier sauvegardes/, ignoré par git).
// Neon ne garde que 6 h d'historique sur le plan gratuit : à lancer régulièrement.
//   npm run sauvegarde          → base de PRODUCTION (URL commentée dans .env)
//   npm run sauvegarde -- --dev → base de dev (DATABASE_URL), pour essayer
// Le fichier contient toutes les données des élèves : le garder privé, ne jamais le publier.
import "dotenv/config";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { nomFichierSauvegarde, urlProdDepuisEnv } from "../lib/sauvegarde";

async function main() {
  const cible = process.argv.includes("--dev") ? "dev" : "prod";
  const hoteProd = process.env.PROD_DATABASE_URL_HOST?.trim() ?? "";
  if (!hoteProd) throw new Error("PROD_DATABASE_URL_HOST absent du .env : refus de tourner.");

  const url =
    cible === "prod"
      ? urlProdDepuisEnv(readFileSync(".env", "utf8"), hoteProd)
      : process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      cible === "prod"
        ? "Ligne « # DATABASE_URL=... » de la production introuvable dans .env."
        : "DATABASE_URL absente du .env.",
    );
  }
  if (cible === "dev" && url.includes(hoteProd)) {
    throw new Error("DATABASE_URL pointe sur la production : utilise la commande sans --dev.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    // Ordre des tables = ordre de restauration (les tables référencées d'abord).
    const tables = {
      coach: await prisma.coach.findMany(),
      eleve: await prisma.eleve.findMany(),
      seance: await prisma.seance.findMany(),
      pack: await prisma.pack.findMany(),
      participation: await prisma.participation.findMany(),
      paiement: await prisma.paiement.findMany(),
    };
    const creeLe = new Date();
    const dossier = join(process.cwd(), "sauvegardes");
    mkdirSync(dossier, { recursive: true });
    const fichier = join(dossier, nomFichierSauvegarde(creeLe, cible));
    writeFileSync(fichier, JSON.stringify({ format: 1, cible, creeLe, tables }, null, 2));

    console.log(`Sauvegarde ${cible} enregistrée : ${fichier}`);
    for (const [nom, lignes] of Object.entries(tables)) console.log(`  ${nom} : ${lignes.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
