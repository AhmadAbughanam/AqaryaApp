-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "ownershipProofType" DROP DEFAULT,
ALTER COLUMN "ownershipProofNumber" DROP DEFAULT,
ALTER COLUMN "description" DROP DEFAULT,
ALTER COLUMN "price" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Simulation" ALTER COLUMN "subtotal" DROP DEFAULT,
ALTER COLUMN "platformFee" DROP DEFAULT,
ALTER COLUMN "governmentFee" DROP DEFAULT,
ALTER COLUMN "totalAmount" DROP DEFAULT,
ALTER COLUMN "expectedAnnualReturn" DROP DEFAULT,
ALTER COLUMN "expectedFiveYearReturn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
