/*
  Warnings:

  - You are about to drop the column `payInMaxFee` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `payInMinFee` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `payOutMaxFee` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `payOutMinFee` on the `offers` table. All the data in the column will be lost.

*/

-- Step 1: Create settle_speeds table first
CREATE TABLE "public"."settle_speeds" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settle_speeds_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create index
CREATE UNIQUE INDEX "settle_speeds_name_key" ON "public"."settle_speeds"("name");

-- Step 3: Insert default settle speed
INSERT INTO "public"."settle_speeds" ("name", "createdAt", "updatedAt") VALUES ('Standard', NOW(), NOW());

-- Step 4: Add new columns as nullable first (safer for production)
ALTER TABLE "public"."offers" ADD COLUMN "payInFee" DOUBLE PRECISION;
ALTER TABLE "public"."offers" ADD COLUMN "payOutFee" DOUBLE PRECISION;
ALTER TABLE "public"."offers" ADD COLUMN "settleSpeedId" INTEGER;

-- Step 5: Migrate data from old columns to new columns (preserve existing data)
-- For payInFee: use payInMinFee as base value, or 0 if null
UPDATE "public"."offers" 
SET "payInFee" = COALESCE("payInMinFee", 0)
WHERE "payInFee" IS NULL;

-- For payOutFee: use payOutMinFee as base value, or 0 if null  
UPDATE "public"."offers" 
SET "payOutFee" = COALESCE("payOutMinFee", 0)
WHERE "payOutFee" IS NULL;

-- Set default settleSpeedId for existing records
UPDATE "public"."offers" 
SET "settleSpeedId" = 1
WHERE "settleSpeedId" IS NULL;

-- Step 6: Make new columns NOT NULL and set defaults
ALTER TABLE "public"."offers" ALTER COLUMN "payInFee" SET NOT NULL;
ALTER TABLE "public"."offers" ALTER COLUMN "payOutFee" SET NOT NULL;
ALTER TABLE "public"."offers" ALTER COLUMN "settleSpeedId" SET NOT NULL;

-- Set default values for future inserts
ALTER TABLE "public"."offers" ALTER COLUMN "payInFee" SET DEFAULT 0;
ALTER TABLE "public"."offers" ALTER COLUMN "payOutFee" SET DEFAULT 0;
ALTER TABLE "public"."offers" ALTER COLUMN "settleSpeedId" SET DEFAULT 1;

-- Step 7: Add foreign key constraint
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_settleSpeedId_fkey" FOREIGN KEY ("settleSpeedId") REFERENCES "public"."settle_speeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Drop old columns (only after data migration is complete)
ALTER TABLE "public"."offers" DROP COLUMN IF EXISTS "payInMaxFee";
ALTER TABLE "public"."offers" DROP COLUMN IF EXISTS "payInMinFee";
ALTER TABLE "public"."offers" DROP COLUMN IF EXISTS "payOutMaxFee";
ALTER TABLE "public"."offers" DROP COLUMN IF EXISTS "payOutMinFee";
