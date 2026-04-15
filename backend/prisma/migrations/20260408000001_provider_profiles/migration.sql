-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('individual', 'owner', 'agency', 'developer', 'partner');

-- CreateEnum
CREATE TYPE "ProviderVerificationStatus" AS ENUM ('unverified', 'under_review', 'verified', 'rejected', 'suspended');

-- AlterEnum: AuditActionType
ALTER TYPE "AuditActionType" ADD VALUE 'provider_under_review';
ALTER TYPE "AuditActionType" ADD VALUE 'provider_verified';
ALTER TYPE "AuditActionType" ADD VALUE 'provider_rejected';
ALTER TYPE "AuditActionType" ADD VALUE 'provider_suspended';
ALTER TYPE "AuditActionType" ADD VALUE 'provider_notes_updated';

-- AlterEnum: NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'provider_status_change';

-- CreateTable
CREATE TABLE "ProviderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "providerVerificationStatus" "ProviderVerificationStatus" NOT NULL DEFAULT 'unverified',
    "businessName" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "registrationNumber" TEXT,
    "licenseNumber" TEXT,
    "providerType" TEXT,
    "documentUrls" JSONB,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_userId_key" ON "ProviderProfile"("userId");

-- CreateIndex
CREATE INDEX "ProviderProfile_accountType_idx" ON "ProviderProfile"("accountType");

-- CreateIndex
CREATE INDEX "ProviderProfile_providerVerificationStatus_idx" ON "ProviderProfile"("providerVerificationStatus");

-- AddForeignKey
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
