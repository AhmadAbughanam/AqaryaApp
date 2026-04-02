-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('citizen', 'admin', 'dlsadmin', 'auditor', 'analyst');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('pending', 'verified', 'frozen');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('login', 'verify', 'freeze', 'anchor', 'simulate');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownershipType" TEXT NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'pending',
    "propertyValue" DOUBLE PRECISION NOT NULL,
    "totalShares" INTEGER NOT NULL,
    "availableShares" INTEGER NOT NULL,
    "verificationTimestamp" TIMESTAMP(3),
    "blockchainHash" TEXT,
    "blockchainTxId" TEXT,
    "anchoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "pricePerShare" DOUBLE PRECISION NOT NULL,
    "ownershipPercentage" DOUBLE PRECISION NOT NULL,
    "simulatedValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "UserRole" NOT NULL,
    "actionType" "AuditActionType" NOT NULL,
    "propertyId" TEXT,
    "metadata" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Simulation_userId_idx" ON "Simulation"("userId");

-- CreateIndex
CREATE INDEX "Simulation_propertyId_idx" ON "Simulation"("propertyId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_propertyId_idx" ON "AuditLog"("propertyId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
