import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const email = process.env.COACH_EMAIL;
  const password = process.env.COACH_PASSWORD;

  if (!email || !password) {
    throw new Error("COACH_EMAIL et COACH_PASSWORD doivent être définis dans .env");
  }

  const motDePasse = await hashPassword(password);

  const coach = await prisma.coach.upsert({
    where: { email },
    update: { motDePasse },
    create: { email, motDePasse, nom: "Coach" },
  });

  console.log(`Compte coach prêt : ${coach.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
