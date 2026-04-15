-- AlterEnum: Add needs_changes to PropertyStatus
ALTER TYPE "PropertyStatus" ADD VALUE 'needs_changes';

-- AlterEnum: Add new audit action types
ALTER TYPE "AuditActionType" ADD VALUE 'listing_changes_requested';
ALTER TYPE "AuditActionType" ADD VALUE 'opportunity_unpublished';

-- AlterTable: Add reviewerNotes to Property
ALTER TABLE "Property" ADD COLUMN "reviewerNotes" TEXT;
