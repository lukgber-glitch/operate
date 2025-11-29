-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "code3" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNative" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currencySymbol" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "fiscalYearStart" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxAuthority" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VatRate" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VatRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionCategory" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxAmount" DECIMAL(10,2),
    "legalBasis" TEXT,
    "requiresProof" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeductionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentApi" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "sandboxUrl" TEXT,
    "authType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentApi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryFeature" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code3_key" ON "Country"("code3");

-- CreateIndex
CREATE INDEX "Country_code_idx" ON "Country"("code");

-- CreateIndex
CREATE INDEX "Country_isActive_idx" ON "Country"("isActive");

-- CreateIndex
CREATE INDEX "Region_countryId_idx" ON "Region"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_countryId_code_key" ON "Region"("countryId", "code");

-- CreateIndex
CREATE INDEX "TaxAuthority_countryId_idx" ON "TaxAuthority"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxAuthority_countryId_code_key" ON "TaxAuthority"("countryId", "code");

-- CreateIndex
CREATE INDEX "VatRate_countryId_idx" ON "VatRate"("countryId");

-- CreateIndex
CREATE INDEX "VatRate_validFrom_validTo_idx" ON "VatRate"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "DeductionCategory_countryId_idx" ON "DeductionCategory"("countryId");

-- CreateIndex
CREATE INDEX "DeductionCategory_isActive_idx" ON "DeductionCategory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DeductionCategory_countryId_code_key" ON "DeductionCategory"("countryId", "code");

-- CreateIndex
CREATE INDEX "GovernmentApi_countryId_idx" ON "GovernmentApi"("countryId");

-- CreateIndex
CREATE INDEX "GovernmentApi_isActive_idx" ON "GovernmentApi"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "GovernmentApi_countryId_name_key" ON "GovernmentApi"("countryId", "name");

-- CreateIndex
CREATE INDEX "CountryFeature_countryId_idx" ON "CountryFeature"("countryId");

-- CreateIndex
CREATE INDEX "CountryFeature_feature_idx" ON "CountryFeature"("feature");

-- CreateIndex
CREATE UNIQUE INDEX "CountryFeature_countryId_feature_key" ON "CountryFeature"("countryId", "feature");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxAuthority" ADD CONSTRAINT "TaxAuthority_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatRate" ADD CONSTRAINT "VatRate_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionCategory" ADD CONSTRAINT "DeductionCategory_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernmentApi" ADD CONSTRAINT "GovernmentApi_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryFeature" ADD CONSTRAINT "CountryFeature_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "EmploymentType" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationCountry" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationCountry_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "TaxCredentialType" AS ENUM ('TAX_ID', 'VAT_ID', 'ELSTER_CERTIFICATE', 'API_KEY', 'OTHER');

-- CreateTable
CREATE TABLE "TaxCredential" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "type" "TaxCredentialType" NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmploymentType_countryId_idx" ON "EmploymentType"("countryId");

-- CreateIndex
CREATE INDEX "EmploymentType_isActive_idx" ON "EmploymentType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentType_countryId_code_key" ON "EmploymentType"("countryId", "code");

-- CreateIndex
CREATE INDEX "OrganisationCountry_orgId_idx" ON "OrganisationCountry"("orgId");

-- CreateIndex
CREATE INDEX "OrganisationCountry_countryId_idx" ON "OrganisationCountry"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationCountry_orgId_countryId_key" ON "OrganisationCountry"("orgId", "countryId");

-- CreateIndex
CREATE INDEX "TaxCredential_orgId_idx" ON "TaxCredential"("orgId");

-- CreateIndex
CREATE INDEX "TaxCredential_countryCode_idx" ON "TaxCredential"("countryCode");

-- CreateIndex
CREATE INDEX "TaxCredential_type_idx" ON "TaxCredential"("type");

-- CreateIndex
CREATE INDEX "TaxCredential_isActive_idx" ON "TaxCredential"("isActive");

-- AddForeignKey
ALTER TABLE "EmploymentType" ADD CONSTRAINT "EmploymentType_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationCountry" ADD CONSTRAINT "OrganisationCountry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationCountry" ADD CONSTRAINT "OrganisationCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCredential" ADD CONSTRAINT "TaxCredential_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
