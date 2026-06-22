-- Retrait de la valeur VIREMENT de l'enum MethodePaiement.
-- Virement et CB sont traités comme identiques : on convertit d'abord
-- les paiements existants en VIREMENT vers CB, puis on recrée l'enum.
UPDATE "Paiement" SET "methode" = 'CB' WHERE "methode" = 'VIREMENT';

-- AlterEnum
BEGIN;
CREATE TYPE "MethodePaiement_new" AS ENUM ('ESPECES', 'CB');
ALTER TABLE "Paiement" ALTER COLUMN "methode" TYPE "MethodePaiement_new" USING ("methode"::text::"MethodePaiement_new");
ALTER TYPE "MethodePaiement" RENAME TO "MethodePaiement_old";
ALTER TYPE "MethodePaiement_new" RENAME TO "MethodePaiement";
DROP TYPE "MethodePaiement_old";
COMMIT;
