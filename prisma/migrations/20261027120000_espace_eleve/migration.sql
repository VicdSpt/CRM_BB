-- Normalisation des emails existants (minuscules, sans espaces) avant l'index unique.
UPDATE "Eleve" SET "email" = lower(trim("email")) WHERE "email" IS NOT NULL;

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('AUCUN', 'EN_ATTENTE', 'VALIDE');

-- AlterTable
ALTER TABLE "Eleve" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "creeParInscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "motDePasse" TEXT,
ADD COLUMN     "statutCompte" "StatutCompte" NOT NULL DEFAULT 'AUCUN';

-- AlterTable
ALTER TABLE "Seance" ADD COLUMN     "capacite" INTEGER NOT NULL DEFAULT 4;

-- CreateIndex
CREATE UNIQUE INDEX "Eleve_email_key" ON "Eleve"("email");

