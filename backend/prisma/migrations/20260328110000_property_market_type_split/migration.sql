CREATE TYPE "MarketType" AS ENUM ('sale', 'investment');

ALTER TABLE "Property"
ADD COLUMN "marketType" "MarketType" NOT NULL DEFAULT 'sale';
