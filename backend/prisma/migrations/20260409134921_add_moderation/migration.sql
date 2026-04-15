-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('listing', 'opportunity');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('spam', 'fraud', 'misleading_info', 'inappropriate', 'duplicate', 'other');

-- CreateEnum
CREATE TYPE "FlagSeverity" AS ENUM ('low', 'medium', 'high');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditActionType" ADD VALUE 'report_created';
ALTER TYPE "AuditActionType" ADD VALUE 'report_reviewed';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'report_update';

-- CreateTable
CREATE TABLE "ModerationReport" (
    "id" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "notes" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityFlag" (
    "id" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "severity" "FlagSeverity" NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "QualityFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModerationReport_targetType_targetId_idx" ON "ModerationReport"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ModerationReport_reporterId_idx" ON "ModerationReport"("reporterId");

-- CreateIndex
CREATE INDEX "ModerationReport_status_idx" ON "ModerationReport"("status");

-- CreateIndex
CREATE INDEX "ModerationReport_createdAt_idx" ON "ModerationReport"("createdAt");

-- CreateIndex
CREATE INDEX "QualityFlag_targetType_targetId_idx" ON "QualityFlag"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "QualityFlag_rule_idx" ON "QualityFlag"("rule");

-- CreateIndex
CREATE INDEX "QualityFlag_severity_idx" ON "QualityFlag"("severity");

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
