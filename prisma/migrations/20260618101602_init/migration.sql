-- CreateEnum
CREATE TYPE "TypeSeance" AS ENUM ('PRIVE', 'COLLECTIF');

-- CreateEnum
CREATE TYPE "StatutSeance" AS ENUM ('PLANIFIEE', 'REALISEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutReglement" AS ENUM ('A_REGLER', 'PAYE', 'COUVERT_PAR_PACK');

-- CreateEnum
CREATE TYPE "MethodePaiement" AS ENUM ('ESPECES', 'CB', 'VIREMENT');

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eleve" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Eleve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL,
    "type" "TypeSeance" NOT NULL,
    "dateHeureDebut" TIMESTAMP(3) NOT NULL,
    "dureeMinutes" INTEGER NOT NULL,
    "lieu" TEXT,
    "prixReference" DECIMAL(10,2) NOT NULL,
    "statut" "StatutSeance" NOT NULL DEFAULT 'PLANIFIEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participation" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "statutReglement" "StatutReglement" NOT NULL DEFAULT 'A_REGLER',
    "montant" DECIMAL(10,2) NOT NULL,
    "packId" TEXT,

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "nbSeancesTotal" INTEGER NOT NULL,
    "nbSeancesRestantes" INTEGER NOT NULL,
    "montantPaye" DECIMAL(10,2) NOT NULL,
    "dateAchat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "methode" "MethodePaiement" NOT NULL,
    "eleveId" TEXT NOT NULL,
    "participationId" TEXT,
    "packId" TEXT,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coach_email_key" ON "Coach"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Participation_seanceId_eleveId_key" ON "Participation"("seanceId", "eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_participationId_key" ON "Paiement"("participationId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_packId_key" ON "Paiement"("packId");

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pack" ADD CONSTRAINT "Pack_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "Participation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
