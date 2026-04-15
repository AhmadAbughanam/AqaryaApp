-- CreateEnum
CREATE TYPE "InvestmentOpportunityStatus" AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "TrustBadgeTier" AS ENUM ('verified', 'premium_verified', 'aqarya_approved');

-- AlterEnum
ALTER TYPE "AuditActionType" ADD VALUE 'opportunity_submitted';
ALTER TYPE "AuditActionType" ADD VALUE 'opportunity_approved';
ALTER TYPE "AuditActionType" ADD VALUE 'opportunity_rejected';
ALTER TYPE "AuditActionType" ADD VALUE 'opportunity_published';
ALTER TYPE "AuditActionType" ADD VALUE 'opportunity_simulate';

-- CreateTable
CREATE TABLE "InvestmentOpportunity" (
    "id" TEXT NOT NULL,
    "status" "InvestmentOpportunityStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrls" JSONB,
    "assetClass" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "sponsorName" TEXT NOT NULL,
    "ownershipStructure" TEXT NOT NULL,
    "distributionModel" TEXT NOT NULL,
    "exitModel" TEXT NOT NULL,
    "totalShares" INTEGER NOT NULL,
    "availableShares" INTEGER NOT NULL,
    "pricePerShare" DOUBLE PRECISION NOT NULL,
    "minimumShares" INTEGER NOT NULL,
    "targetIrr" DOUBLE PRECISION NOT NULL,
    "targetCashYield" DOUBLE PRECISION NOT NULL,
    "targetHoldYears" INTEGER NOT NULL,
    "appreciationRate" DOUBLE PRECISION NOT NULL,
    "occupancyRate" DOUBLE PRECISION NOT NULL,
    "managementFeeRate" DOUBLE PRECISION NOT NULL,
    "riskBand" TEXT NOT NULL,
    "trustScore" INTEGER,
    "trustBadge" "TrustBadgeTier",
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "publishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "verificationRecordId" TEXT,
    "blockchainHash" TEXT,
    "blockchainTxId" TEXT,
    "blockchainStatus" "BlockchainRecordStatus" NOT NULL DEFAULT 'pending',
    "anchoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentSimulation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "pricePerShare" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "governmentFee" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "ownershipPercentage" DOUBLE PRECISION NOT NULL,
    "expectedAnnualReturn" DOUBLE PRECISION NOT NULL,
    "expectedFiveYearReturn" DOUBLE PRECISION NOT NULL,
    "simulatedValue" DOUBLE PRECISION NOT NULL,
    "holdingPeriodYears" INTEGER NOT NULL,
    "exitScenario" TEXT NOT NULL,
    "reinvestDistributions" BOOLEAN NOT NULL,
    "annualGrossIncome" DOUBLE PRECISION NOT NULL,
    "annualManagementFee" DOUBLE PRECISION NOT NULL,
    "annualNetCashFlow" DOUBLE PRECISION NOT NULL,
    "exitFee" DOUBLE PRECISION NOT NULL,
    "projectedExitValue" DOUBLE PRECISION NOT NULL,
    "projectedNetExitProceeds" DOUBLE PRECISION NOT NULL,
    "projectedProfit" DOUBLE PRECISION NOT NULL,
    "equityMultiple" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestmentOpportunity_status_idx" ON "InvestmentOpportunity"("status");

-- CreateIndex
CREATE INDEX "InvestmentOpportunity_assetClass_idx" ON "InvestmentOpportunity"("assetClass");

-- CreateIndex
CREATE INDEX "InvestmentOpportunity_riskBand_idx" ON "InvestmentOpportunity"("riskBand");

-- CreateIndex
CREATE INDEX "InvestmentSimulation_userId_idx" ON "InvestmentSimulation"("userId");

-- CreateIndex
CREATE INDEX "InvestmentSimulation_opportunityId_idx" ON "InvestmentSimulation"("opportunityId");

-- AddForeignKey
ALTER TABLE "InvestmentSimulation" ADD CONSTRAINT "InvestmentSimulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentSimulation" ADD CONSTRAINT "InvestmentSimulation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "InvestmentOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
