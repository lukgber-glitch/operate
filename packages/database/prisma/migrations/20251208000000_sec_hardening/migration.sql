-- SEC-005: Add refresh token rotation support
ALTER TABLE "Session" ADD COLUMN "isUsed" BOOLEAN NOT NULL DEFAULT false;

-- SEC-005: Create TokenRefreshHistory table for audit trail
CREATE TABLE "TokenRefreshHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldTokenHash" TEXT NOT NULL,
    "newTokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRefreshHistory_pkey" PRIMARY KEY ("id")
);

-- Create indexes for TokenRefreshHistory
CREATE INDEX "TokenRefreshHistory_userId_idx" ON "TokenRefreshHistory"("userId");
CREATE INDEX "TokenRefreshHistory_refreshedAt_idx" ON "TokenRefreshHistory"("refreshedAt");
