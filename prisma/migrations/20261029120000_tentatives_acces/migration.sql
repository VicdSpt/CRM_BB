-- CreateEnum
CREATE TYPE "TypeTentative" AS ENUM ('CONNEXION_ECHEC', 'INSCRIPTION');

-- CreateTable
CREATE TABLE "TentativeAcces" (
    "id" TEXT NOT NULL,
    "type" "TypeTentative" NOT NULL,
    "cle" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativeAcces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TentativeAcces_type_cle_creeLe_idx" ON "TentativeAcces"("type", "cle", "creeLe");

-- CreateIndex
CREATE INDEX "TentativeAcces_creeLe_idx" ON "TentativeAcces"("creeLe");

