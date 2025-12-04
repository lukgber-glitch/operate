-- CreateEnum
CREATE TYPE "TaxPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'SEMI_ANNUAL', 'BI_MONTHLY');

-- CreateEnum
CREATE TYPE "TaxCategory" AS ENUM ('STANDARD', 'REDUCED', 'SUPER_REDUCED', 'ZERO', 'EXEMPT', 'PARKING', 'INTERMEDIATE');

-- CreateEnum
CREATE TYPE "InvoiceNumberingType" AS ENUM ('SEQUENTIAL', 'YEAR_PREFIX', 'CUSTOM_PREFIX', 'FREE_FORMAT');

-- CreateTable
CREATE TABLE "CountryTaxConfig" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "vatPeriodType" "TaxPeriodType" NOT NULL,
    "corporateTaxPeriodType" "TaxPeriodType" NOT NULL,
    "vatFilingDeadlineDays" INTEGER NOT NULL,
    "vatPaymentDeadlineDays" INTEGER NOT NULL,
    "corporateTaxFilingDays" INTEGER NOT NULL,
    "corporateTaxPaymentDays" INTEGER NOT NULL,
    "invoiceNumberingType" "InvoiceNumberingType" NOT NULL DEFAULT 'SEQUENTIAL',
    "invoiceNumberingFormat" TEXT,
    "requiresDigitalSignature" BOOLEAN NOT NULL DEFAULT false,
    "requiresQrCode" BOOLEAN NOT NULL DEFAULT false,
    "requiresEInvoicing" BOOLEAN NOT NULL DEFAULT false,
    "eInvoicingMandateDate" TIMESTAMP(3),
    "eInvoicingFormat" TEXT,
    "eInvoicingNetwork" TEXT,
    "viesValidationRequired" BOOLEAN NOT NULL DEFAULT true,
    "intraCommunityThreshold" DECIMAL(12,2),
    "fiscalRepresentativeRequired" BOOLEAN NOT NULL DEFAULT false,
    "fiscalRepThreshold" DECIMAL(12,2),
    "requiresSaftT" BOOLEAN NOT NULL DEFAULT false,
    "saftTFrequency" "TaxPeriodType",
    "notes" TEXT,
    "legalBasis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryTaxConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VatRateConfig" (
    "id" TEXT NOT NULL,
    "taxConfigId" TEXT NOT NULL,
    "category" "TaxCategory" NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "description" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "conditions" TEXT,
    "exemptions" TEXT,
    "examples" TEXT,
    "legalBasis" TEXT,
    "euDirectiveRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VatRateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxFilingDeadline" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "periodType" "TaxPeriodType" NOT NULL,
    "year" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "filingDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isExtended" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxFilingDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CountryTaxConfig_countryId_key" ON "CountryTaxConfig"("countryId");

-- CreateIndex
CREATE INDEX "VatRateConfig_taxConfigId_idx" ON "VatRateConfig"("taxConfigId");

-- CreateIndex
CREATE INDEX "VatRateConfig_category_idx" ON "VatRateConfig"("category");

-- CreateIndex
CREATE INDEX "VatRateConfig_validFrom_validTo_idx" ON "VatRateConfig"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "TaxFilingDeadline_countryId_idx" ON "TaxFilingDeadline"("countryId");

-- CreateIndex
CREATE INDEX "TaxFilingDeadline_filingDate_idx" ON "TaxFilingDeadline"("filingDate");

-- CreateIndex
CREATE INDEX "TaxFilingDeadline_taxType_idx" ON "TaxFilingDeadline"("taxType");

-- CreateIndex
CREATE UNIQUE INDEX "TaxFilingDeadline_countryId_taxType_year_period_key" ON "TaxFilingDeadline"("countryId", "taxType", "year", "period");

-- AddForeignKey
ALTER TABLE "CountryTaxConfig" ADD CONSTRAINT "CountryTaxConfig_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatRateConfig" ADD CONSTRAINT "VatRateConfig_taxConfigId_fkey" FOREIGN KEY ("taxConfigId") REFERENCES "CountryTaxConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxFilingDeadline" ADD CONSTRAINT "TaxFilingDeadline_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
