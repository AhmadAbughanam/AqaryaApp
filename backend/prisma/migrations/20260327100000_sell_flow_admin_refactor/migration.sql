-- Normalize legacy role values before tightening the enum.
UPDATE "User"
SET "role" = 'admin'
WHERE "role" IN ('dlsadmin', 'auditor', 'analyst');

UPDATE "AuditLog"
SET "actorRole" = 'admin'
WHERE "actorRole" IN ('dlsadmin', 'auditor', 'analyst');

-- Replace role enum with unified citizen/admin values.
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('citizen', 'admin');

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "UserRole"
USING ("role"::text::"UserRole");

ALTER TABLE "AuditLog"
ALTER COLUMN "actorRole" TYPE "UserRole"
USING ("actorRole"::text::"UserRole");

DROP TYPE "UserRole_old";

-- Replace property status enum with selling lifecycle values.
ALTER TYPE "PropertyStatus" RENAME TO "PropertyStatus_old";
CREATE TYPE "PropertyStatus" AS ENUM (
  'pending_verification',
  'verified',
  'rejected',
  'frozen',
  'sold'
);

ALTER TABLE "Property"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Property"
ALTER COLUMN "status" TYPE "PropertyStatus"
USING (
  CASE "status"::text
    WHEN 'pending' THEN 'pending_verification'
    WHEN 'verified' THEN 'verified'
    WHEN 'frozen' THEN 'frozen'
    ELSE 'pending_verification'
  END::"PropertyStatus"
);

ALTER TABLE "Property"
ALTER COLUMN "status" SET DEFAULT 'pending_verification';

DROP TYPE "PropertyStatus_old";

-- Replace audit action enum with explicit listing lifecycle actions.
ALTER TYPE "AuditActionType" RENAME TO "AuditActionType_old";
CREATE TYPE "AuditActionType" AS ENUM (
  'login',
  'listing_submitted',
  'listing_verified',
  'listing_rejected',
  'listing_frozen',
  'anchor',
  'simulate'
);

ALTER TABLE "AuditLog"
ALTER COLUMN "actionType" TYPE "AuditActionType"
USING (
  CASE "actionType"::text
    WHEN 'verify' THEN 'listing_verified'
    WHEN 'freeze' THEN 'listing_frozen'
    ELSE "actionType"::text
  END::"AuditActionType"
);

DROP TYPE "AuditActionType_old";

CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE "BlockchainRecordStatus" AS ENUM ('pending', 'anchored', 'failed');

ALTER TABLE "User"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Property"
ADD COLUMN "ownerId" TEXT,
ADD COLUMN "ownershipProofType" TEXT NOT NULL DEFAULT 'title_deed',
ADD COLUMN "ownershipProofNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "imageUrls" JSONB,
ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "propertyVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "identityVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "blockchainStatus" "BlockchainRecordStatus" NOT NULL DEFAULT 'pending';

UPDATE "Property"
SET
  "price" = "propertyValue",
  "propertyVerificationStatus" = CASE
    WHEN "status" = 'verified' THEN 'verified'::"VerificationStatus"
    WHEN "status" = 'rejected' THEN 'rejected'::"VerificationStatus"
    ELSE 'pending'::"VerificationStatus"
  END,
  "identityVerificationStatus" = CASE
    WHEN "status" = 'verified' THEN 'verified'::"VerificationStatus"
    WHEN "status" = 'rejected' THEN 'rejected'::"VerificationStatus"
    ELSE 'pending'::"VerificationStatus"
  END,
  "blockchainStatus" = CASE
    WHEN "blockchainHash" IS NOT NULL THEN 'anchored'::"BlockchainRecordStatus"
    ELSE 'pending'::"BlockchainRecordStatus"
  END;

ALTER TABLE "Simulation"
ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "governmentFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "expectedAnnualReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "expectedFiveYearReturn" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Simulation"
SET
  "subtotal" = "simulatedValue",
  "totalAmount" = "simulatedValue",
  "expectedAnnualReturn" = ROUND(("simulatedValue" * 0.08)::numeric, 2)::double precision,
  "expectedFiveYearReturn" = ROUND(("simulatedValue" * 0.4)::numeric, 2)::double precision;

ALTER TABLE "Property"
ADD CONSTRAINT "Property_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");
CREATE INDEX "Property_status_idx" ON "Property"("status");
