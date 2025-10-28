/*
  Warnings:

  - You are about to drop the column `maxChequeAmount` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `minChequeAmount` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `trafficVolumeFrom` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `trafficVolumeTo` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `countryId` on the `payment_services` table. All the data in the column will be lost.
  - You are about to drop the column `currencyId` on the `payment_services` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeTypeId` on the `payment_services` table. All the data in the column will be lost.
  - You are about to drop the column `offerIds` on the `payment_services` table. All the data in the column will be lost.
  - You are about to drop the column `websiteUrl` on the `payment_services` table. All the data in the column will be lost.
  - You are about to drop the `offer_balance_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `offer_exchange_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `offer_payment_methods` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `offers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `maxCheque` to the `offers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minCheque` to the `offers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethodId` to the `offers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `offers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trafficVolumeMax` to the `offers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."offer_balance_types" DROP CONSTRAINT "offer_balance_types_balanceTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."offer_balance_types" DROP CONSTRAINT "offer_balance_types_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."offer_exchange_types" DROP CONSTRAINT "offer_exchange_types_exchangeTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."offer_exchange_types" DROP CONSTRAINT "offer_exchange_types_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."offer_payment_methods" DROP CONSTRAINT "offer_payment_methods_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."offer_payment_methods" DROP CONSTRAINT "offer_payment_methods_paymentMethodId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payment_services" DROP CONSTRAINT "payment_services_countryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payment_services" DROP CONSTRAINT "payment_services_currencyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payment_services" DROP CONSTRAINT "payment_services_exchangeTypeId_fkey";

-- AlterTable
ALTER TABLE "public"."offers" DROP COLUMN "maxChequeAmount",
DROP COLUMN "minChequeAmount",
DROP COLUMN "trafficVolumeFrom",
DROP COLUMN "trafficVolumeTo",
ADD COLUMN     "maxCheque" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "minCheque" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "paymentMethodId" INTEGER NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "trafficVolumeMax" INTEGER NOT NULL,
ADD COLUMN     "trafficVolumeMin" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."payment_services" DROP COLUMN "countryId",
DROP COLUMN "currencyId",
DROP COLUMN "exchangeTypeId",
DROP COLUMN "offerIds",
DROP COLUMN "websiteUrl",
ADD COLUMN     "email" TEXT,
ALTER COLUMN "paymentPageExampleLink" DROP NOT NULL,
ALTER COLUMN "cabinetExampleLink" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."offer_balance_types";

-- DropTable
DROP TABLE "public"."offer_exchange_types";

-- DropTable
DROP TABLE "public"."offer_payment_methods";

-- CreateTable
CREATE TABLE "public"."offer_payment_system_types" (
    "offerId" INTEGER NOT NULL,
    "paymentSystemTypeId" INTEGER NOT NULL,

    CONSTRAINT "offer_payment_system_types_pkey" PRIMARY KEY ("offerId","paymentSystemTypeId")
);

-- CreateTable
CREATE TABLE "public"."payment_service_countries" (
    "paymentServiceId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "payment_service_countries_pkey" PRIMARY KEY ("paymentServiceId","countryId")
);

-- CreateTable
CREATE TABLE "public"."payment_service_currencies" (
    "paymentServiceId" INTEGER NOT NULL,
    "currencyId" INTEGER NOT NULL,

    CONSTRAINT "payment_service_currencies_pkey" PRIMARY KEY ("paymentServiceId","currencyId")
);

-- CreateTable
CREATE TABLE "public"."payment_service_payment_system_types" (
    "paymentServiceId" INTEGER NOT NULL,
    "paymentSystemTypeId" INTEGER NOT NULL,

    CONSTRAINT "payment_service_payment_system_types_pkey" PRIMARY KEY ("paymentServiceId","paymentSystemTypeId")
);

-- CreateTable
CREATE TABLE "public"."payment_system_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_system_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_system_types_name_key" ON "public"."payment_system_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "offers_slug_key" ON "public"."offers"("slug");

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_payment_system_types" ADD CONSTRAINT "offer_payment_system_types_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_payment_system_types" ADD CONSTRAINT "offer_payment_system_types_paymentSystemTypeId_fkey" FOREIGN KEY ("paymentSystemTypeId") REFERENCES "public"."payment_system_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_countries" ADD CONSTRAINT "payment_service_countries_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_countries" ADD CONSTRAINT "payment_service_countries_paymentServiceId_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_currencies" ADD CONSTRAINT "payment_service_currencies_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_currencies" ADD CONSTRAINT "payment_service_currencies_paymentServiceId_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_payment_system_types" ADD CONSTRAINT "payment_service_payment_system_types_paymentServiceId_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_payment_system_types" ADD CONSTRAINT "payment_service_payment_system_types_paymentSystemTypeId_fkey" FOREIGN KEY ("paymentSystemTypeId") REFERENCES "public"."payment_system_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
