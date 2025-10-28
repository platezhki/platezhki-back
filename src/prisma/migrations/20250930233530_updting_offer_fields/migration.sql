/*
  Warnings:

  - You are about to drop the column `maxCheque` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `minCheque` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `payInFee` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `payOutFee` on the `offers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."offers" DROP COLUMN "maxCheque",
DROP COLUMN "minCheque",
DROP COLUMN "payInFee",
DROP COLUMN "payOutFee",
ADD COLUMN     "payInMaxFee" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "payInMaxLimit" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "payInMinFee" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "payInMinLimit" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "payOutMaxFee" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "payOutMaxLimit" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "payOutMinFee" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "payOutMinLimit" DOUBLE PRECISION DEFAULT 0;
