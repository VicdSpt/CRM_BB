// Vérifie qu'une dernière place réservée en même temps par deux élèves ne fait pas
// dépasser la capacité. À lancer UNIQUEMENT sur la base de dev :
//   npx tsx scripts/verif-reservation-concurrente.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { reserverDansTransaction } from "../lib/espace/reservation";

async function main() {
  const hoteProd = process.env.PROD_DATABASE_URL_HOST?.trim();
  if (!hoteProd) throw new Error("PROD_DATABASE_URL_HOST absent du .env : refus de tourner.");
  if (process.env.DATABASE_URL?.includes(hoteProd)) {
    throw new Error("DATABASE_URL pointe sur la production : refus de tourner.");
  }

  const debut = new Date(Date.now() + 7 * 24 * 3_600_000);
  const seance = await prisma.seance.create({
    data: { type: "COLLECTIF", dateHeureDebut: debut, dureeMinutes: 60, prixReference: "10", capacite: 1 },
  });
  const [a, b] = await Promise.all(
    ["a", "b"].map((x) =>
      prisma.eleve.create({
        data: { prenom: "Concurrence", nom: x.toUpperCase(), statutCompte: "VALIDE" },
      }),
    ),
  );

  try {
    const now = new Date();
    const resultats = await Promise.all([
      reserverDansTransaction(seance.id, a.id, now),
      reserverDansTransaction(seance.id, b.id, now),
    ]);
    const nb = await prisma.participation.count({ where: { seanceId: seance.id } });
    const refus = resultats.filter((r) => r.erreur).map((r) => r.erreur);
    console.log(`${nb} participation, ${refus.length} refus : ${refus.join(" | ")}`);
    if (nb !== 1 || refus.length !== 1) process.exitCode = 1;
  } finally {
    await prisma.seance.delete({ where: { id: seance.id } });
    await prisma.eleve.deleteMany({ where: { id: { in: [a.id, b.id] } } });
    await prisma.$disconnect();
  }
}

main();
