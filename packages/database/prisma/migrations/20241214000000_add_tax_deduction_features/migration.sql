-- CreateEnum
CREATE TYPE "DeductionSuggestionStatus" AS ENUM ('SUGGESTED', 'CONFIRMED', 'REJECTED', 'MODIFIED');

-- CreateEnum
CREATE TYPE "TaxDeductionType" AS ENUM ('COMMUTER_ALLOWANCE', 'HOME_OFFICE_FLAT', 'PER_DIEM_MEALS', 'MILEAGE_BUSINESS', 'TRAINING_EDUCATION', 'HOME_OFFICE_ROOM', 'WORK_EQUIPMENT', 'BUSINESS_MEALS', 'OFFICE_SUPPLIES', 'PHONE_INTERNET', 'INSURANCE', 'DONATIONS', 'OTHER');

-- CreateTable
CREATE TABLE "TaxDeductionEntry" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT,
    "category" "TaxDeductionType" NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "originalAmount" DECIMAL(10,2) NOT NULL,
    "deductibleAmount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "calculatorData" JSONB,
    "distanceKm" DECIMAL(8,2),
    "workingDays" INTEGER,
    "usePublicTransport" BOOLEAN NOT NULL DEFAULT false,
    "daysWorkedFromHome" INTEGER,
    "roomSqm" DECIMAL(6,2),
    "totalHomeSqm" DECIMAL(6,2),
    "monthlyRent" DECIMAL(10,2),
    "tripStartDate" TIMESTAMP(3),
    "tripEndDate" TIMESTAMP(3),
    "tripDestination" TEXT,
    "isInternational" BOOLEAN NOT NULL DEFAULT false,
    "vehicleType" TEXT,
    "tripPurpose" TEXT,
    "trainingType" TEXT,
    "providerName" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "receiptAttached" BOOLEAN NOT NULL DEFAULT false,
    "documentIds" TEXT[],
    "legalReference" TEXT,
    "status" "DeductionSuggestionStatus" NOT NULL DEFAULT 'CONFIRMED',
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDeductionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeductionRateConfig" (
    "id" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "category" "TaxDeductionType" NOT NULL,
    "config" JSONB NOT NULL,
    "legalReference" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "TaxDeductionRateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxDeductionEntry_organisationId_taxYear_idx" ON "TaxDeductionEntry"("organisationId", "taxYear");

-- CreateIndex
CREATE INDEX "TaxDeductionEntry_organisationId_category_idx" ON "TaxDeductionEntry"("organisationId", "category");

-- CreateIndex
CREATE INDEX "TaxDeductionEntry_userId_idx" ON "TaxDeductionEntry"("userId");

-- CreateIndex
CREATE INDEX "TaxDeductionEntry_countryCode_taxYear_idx" ON "TaxDeductionEntry"("countryCode", "taxYear");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDeductionRateConfig_countryCode_taxYear_category_key" ON "TaxDeductionRateConfig"("countryCode", "taxYear", "category");

-- CreateIndex
CREATE INDEX "TaxDeductionRateConfig_countryCode_taxYear_idx" ON "TaxDeductionRateConfig"("countryCode", "taxYear");

-- AddForeignKey
ALTER TABLE "TaxDeductionEntry" ADD CONSTRAINT "TaxDeductionEntry_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeductionEntry" ADD CONSTRAINT "TaxDeductionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
