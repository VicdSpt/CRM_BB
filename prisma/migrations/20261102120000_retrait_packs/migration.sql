-- Retrait du système de packs (décision du 2026-11-02 ; données de prod fictives).
-- 1. Nettoyage des données : les paiements d'achat de pack disparaissent et les
--    séances couvertes par un pack repassent « à régler ».
DELETE FROM "Paiement" WHERE "packId" IS NOT NULL;
UPDATE "Participation"
SET "statutReglement" = 'A_REGLER', "packId" = NULL
WHERE "statutReglement" = 'COUVERT_PAR_PACK' OR "packId" IS NOT NULL;

-- 2. Schéma (généré par prisma migrate diff).
-- AlterEnum
BEGIN;
CREATE TYPE "StatutReglement_new" AS ENUM ('A_REGLER', 'PAYE');
ALTER TABLE "Participation" ALTER COLUMN "statutReglement" DROP DEFAULT;
ALTER TABLE "Participation" ALTER COLUMN "statutReglement" TYPE "StatutReglement_new" USING ("statutReglement"::text::"StatutReglement_new");
ALTER TYPE "StatutReglement" RENAME TO "StatutReglement_old";
ALTER TYPE "StatutReglement_new" RENAME TO "StatutReglement";
DROP TYPE "StatutReglement_old";
ALTER TABLE "Participation" ALTER COLUMN "statutReglement" SET DEFAULT 'A_REGLER';
COMMIT;

-- DropForeignKey
ALTER TABLE "Participation" DROP CONSTRAINT "Participation_packId_fkey";

-- DropForeignKey
ALTER TABLE "Pack" DROP CONSTRAINT "Pack_eleveId_fkey";

-- DropForeignKey
ALTER TABLE "Paiement" DROP CONSTRAINT "Paiement_packId_fkey";

-- DropIndex
DROP INDEX "Paiement_packId_key";

-- AlterTable
ALTER TABLE "Participation" DROP COLUMN "packId";

-- AlterTable
ALTER TABLE "Paiement" DROP COLUMN "packId";

-- DropTable
DROP TABLE "Pack";

