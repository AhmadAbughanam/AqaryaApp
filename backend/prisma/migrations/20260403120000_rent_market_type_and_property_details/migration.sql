-- AlterEnum
-- Note: PostgreSQL requires this to run outside a transaction.
-- Prisma handles this automatically when running `prisma migrate deploy`.
ALTER TYPE "MarketType" ADD VALUE 'rent';

-- AlterTable: Add optional property detail columns
ALTER TABLE "Property"
ADD COLUMN "amenities" JSONB,
ADD COLUMN "areaSqm" DOUBLE PRECISION,
ADD COLUMN "bathrooms" INTEGER,
ADD COLUMN "bedrooms" INTEGER,
ADD COLUMN "city" TEXT,
ADD COLUMN "propertyType" TEXT;

-- CreateIndex: marketType filter index
CREATE INDEX "Property_marketType_idx" ON "Property"("marketType");

-- CreateIndex: city filter index
CREATE INDEX "Property_city_idx" ON "Property"("city");
