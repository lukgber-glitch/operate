-- Create ELSTER certificate management tables

-- Certificate storage with encrypted data
CREATE TABLE "ElsterCertificate" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "encryptedData" BYTEA NOT NULL,
    "encryptedPassword" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "authTag" BYTEA NOT NULL,
    "serialNumber" TEXT,
    "issuer" TEXT,
    "subject" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ElsterCertificate_pkey" PRIMARY KEY ("id")
);

-- Audit log for certificate operations
CREATE TABLE "ElsterCertificateAuditLog" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElsterCertificateAuditLog_pkey" PRIMARY KEY ("id")
);

-- Indexes for performance
CREATE INDEX "ElsterCertificate_organisationId_idx" ON "ElsterCertificate"("organisationId");
CREATE INDEX "ElsterCertificate_validTo_idx" ON "ElsterCertificate"("validTo");
CREATE INDEX "ElsterCertificate_isActive_idx" ON "ElsterCertificate"("isActive");
CREATE INDEX "ElsterCertificateAuditLog_certificateId_idx" ON "ElsterCertificateAuditLog"("certificateId");
CREATE INDEX "ElsterCertificateAuditLog_organisationId_idx" ON "ElsterCertificateAuditLog"("organisationId");
CREATE INDEX "ElsterCertificateAuditLog_createdAt_idx" ON "ElsterCertificateAuditLog"("createdAt");
CREATE INDEX "ElsterCertificateAuditLog_action_idx" ON "ElsterCertificateAuditLog"("action");

-- Foreign key constraints
ALTER TABLE "ElsterCertificate" ADD CONSTRAINT "ElsterCertificate_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
