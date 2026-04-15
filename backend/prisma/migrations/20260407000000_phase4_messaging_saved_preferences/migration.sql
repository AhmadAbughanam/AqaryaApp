-- Phase 4: Messaging, Saved Items, and User Preferences

-- Create SavedItemType enum
CREATE TYPE "SavedItemType" AS ENUM ('listing', 'opportunity');

-- Extend AuditActionType with new values
ALTER TYPE "AuditActionType" ADD VALUE 'thread_created';
ALTER TYPE "AuditActionType" ADD VALUE 'message_sent';

-- CreateTable SavedItem
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SavedItemType" NOT NULL,
    "propertyId" TEXT,
    "opportunityId" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable Thread
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "listingId" TEXT,
    "opportunityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable Message
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "UserRole" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable UserPreference
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'en',

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "SavedItem_userId_idx" ON "SavedItem"("userId");
CREATE INDEX "SavedItem_propertyId_idx" ON "SavedItem"("propertyId");
CREATE INDEX "SavedItem_opportunityId_idx" ON "SavedItem"("opportunityId");

-- Partial unique indexes to prevent duplicate saves
CREATE UNIQUE INDEX "SavedItem_userId_propertyId_key" ON "SavedItem"("userId", "propertyId") WHERE "propertyId" IS NOT NULL;
CREATE UNIQUE INDEX "SavedItem_userId_opportunityId_key" ON "SavedItem"("userId", "opportunityId") WHERE "opportunityId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Thread_citizenId_idx" ON "Thread"("citizenId");
CREATE INDEX "Thread_listingId_idx" ON "Thread"("listingId");
CREATE INDEX "Thread_opportunityId_idx" ON "Thread"("opportunityId");

-- CreateIndex
CREATE INDEX "Message_threadId_idx" ON "Message"("threadId");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "InvestmentOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Thread" ADD CONSTRAINT "Thread_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "InvestmentOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
