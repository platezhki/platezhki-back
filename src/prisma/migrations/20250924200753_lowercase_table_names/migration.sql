/*
  Warnings:

  - You are about to drop the `BalanceType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConnectionType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Currency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExchangeType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Language` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Offer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferBalanceType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferConnectionType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferCountry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferCurrency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferExchangeType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferPaymentMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferTrafficSource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferTrafficType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentServiceLanguage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentServicePaymentMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrafficSource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrafficType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Translation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Language" DROP CONSTRAINT "Language_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Offer" DROP CONSTRAINT "Offer_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferBalanceType" DROP CONSTRAINT "OfferBalanceType_balanceTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferBalanceType" DROP CONSTRAINT "OfferBalanceType_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferConnectionType" DROP CONSTRAINT "OfferConnectionType_connectionTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferConnectionType" DROP CONSTRAINT "OfferConnectionType_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferCountry" DROP CONSTRAINT "OfferCountry_countryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferCountry" DROP CONSTRAINT "OfferCountry_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferCurrency" DROP CONSTRAINT "OfferCurrency_currencyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferCurrency" DROP CONSTRAINT "OfferCurrency_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferExchangeType" DROP CONSTRAINT "OfferExchangeType_exchangeTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferExchangeType" DROP CONSTRAINT "OfferExchangeType_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferPaymentMethod" DROP CONSTRAINT "OfferPaymentMethod_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferPaymentMethod" DROP CONSTRAINT "OfferPaymentMethod_paymentMethodId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferTrafficSource" DROP CONSTRAINT "OfferTrafficSource_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferTrafficSource" DROP CONSTRAINT "OfferTrafficSource_trafficSourceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferTrafficType" DROP CONSTRAINT "OfferTrafficType_offerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OfferTrafficType" DROP CONSTRAINT "OfferTrafficType_trafficTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentService" DROP CONSTRAINT "PaymentService_countryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentService" DROP CONSTRAINT "PaymentService_currencyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentService" DROP CONSTRAINT "PaymentService_exchangeTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentService" DROP CONSTRAINT "PaymentService_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentServiceLanguage" DROP CONSTRAINT "PaymentServiceLanguage_languageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentServiceLanguage" DROP CONSTRAINT "PaymentServiceLanguage_paymentServiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentServicePaymentMethod" DROP CONSTRAINT "PaymentServicePayInMethods_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentServicePaymentMethod" DROP CONSTRAINT "PaymentServicePayOutMethods_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentServicePaymentMethod" DROP CONSTRAINT "PaymentServicePaymentMethod_paymentMethodId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Setting" DROP CONSTRAINT "Setting_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Translation" DROP CONSTRAINT "Translation_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_roleId_fkey";

-- DropTable
DROP TABLE "public"."BalanceType";

-- DropTable
DROP TABLE "public"."ConnectionType";

-- DropTable
DROP TABLE "public"."Country";

-- DropTable
DROP TABLE "public"."Currency";

-- DropTable
DROP TABLE "public"."ExchangeType";

-- DropTable
DROP TABLE "public"."Language";

-- DropTable
DROP TABLE "public"."Offer";

-- DropTable
DROP TABLE "public"."OfferBalanceType";

-- DropTable
DROP TABLE "public"."OfferConnectionType";

-- DropTable
DROP TABLE "public"."OfferCountry";

-- DropTable
DROP TABLE "public"."OfferCurrency";

-- DropTable
DROP TABLE "public"."OfferExchangeType";

-- DropTable
DROP TABLE "public"."OfferPaymentMethod";

-- DropTable
DROP TABLE "public"."OfferTrafficSource";

-- DropTable
DROP TABLE "public"."OfferTrafficType";

-- DropTable
DROP TABLE "public"."PaymentMethod";

-- DropTable
DROP TABLE "public"."PaymentService";

-- DropTable
DROP TABLE "public"."PaymentServiceLanguage";

-- DropTable
DROP TABLE "public"."PaymentServicePaymentMethod";

-- DropTable
DROP TABLE "public"."Role";

-- DropTable
DROP TABLE "public"."Setting";

-- DropTable
DROP TABLE "public"."TrafficSource";

-- DropTable
DROP TABLE "public"."TrafficType";

-- DropTable
DROP TABLE "public"."Translation";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_services" (
    "id" SERIAL NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "establishedAt" TIMESTAMP(3) NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "contacts" TEXT[],
    "paymentPageExampleLink" TEXT NOT NULL,
    "paymentPageExampleImageUrls" TEXT[],
    "cabinetExampleLink" TEXT NOT NULL,
    "cabinetExampleImageUrls" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "countryId" INTEGER NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "exchangeTypeId" INTEGER NOT NULL,

    CONSTRAINT "payment_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "trafficVolumeFrom" INTEGER NOT NULL DEFAULT 0,
    "trafficVolumeTo" INTEGER NOT NULL,
    "payInFee" DOUBLE PRECISION NOT NULL,
    "payOutFee" DOUBLE PRECISION NOT NULL,
    "minChequeAmount" DOUBLE PRECISION NOT NULL,
    "maxChequeAmount" DOUBLE PRECISION NOT NULL,
    "support247" BOOLEAN NOT NULL,
    "automatics" BOOLEAN NOT NULL,
    "legalPerson" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offer_countries" (
    "offerId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "offer_countries_pkey" PRIMARY KEY ("offerId","countryId")
);

-- CreateTable
CREATE TABLE "public"."offer_currencies" (
    "offerId" INTEGER NOT NULL,
    "currencyId" INTEGER NOT NULL,

    CONSTRAINT "offer_currencies_pkey" PRIMARY KEY ("offerId","currencyId")
);

-- CreateTable
CREATE TABLE "public"."offer_exchange_types" (
    "offerId" INTEGER NOT NULL,
    "exchangeTypeId" INTEGER NOT NULL,

    CONSTRAINT "offer_exchange_types_pkey" PRIMARY KEY ("offerId","exchangeTypeId")
);

-- CreateTable
CREATE TABLE "public"."offer_payment_methods" (
    "offerId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,

    CONSTRAINT "offer_payment_methods_pkey" PRIMARY KEY ("offerId","paymentMethodId")
);

-- CreateTable
CREATE TABLE "public"."offer_traffic_sources" (
    "offerId" INTEGER NOT NULL,
    "trafficSourceId" INTEGER NOT NULL,

    CONSTRAINT "offer_traffic_sources_pkey" PRIMARY KEY ("offerId","trafficSourceId")
);

-- CreateTable
CREATE TABLE "public"."offer_traffic_types" (
    "offerId" INTEGER NOT NULL,
    "trafficTypeId" INTEGER NOT NULL,

    CONSTRAINT "offer_traffic_types_pkey" PRIMARY KEY ("offerId","trafficTypeId")
);

-- CreateTable
CREATE TABLE "public"."offer_balance_types" (
    "offerId" INTEGER NOT NULL,
    "balanceTypeId" INTEGER NOT NULL,

    CONSTRAINT "offer_balance_types_pkey" PRIMARY KEY ("offerId","balanceTypeId")
);

-- CreateTable
CREATE TABLE "public"."offer_connection_types" (
    "offerId" INTEGER NOT NULL,
    "connectionTypeId" INTEGER NOT NULL,

    CONSTRAINT "offer_connection_types_pkey" PRIMARY KEY ("offerId","connectionTypeId")
);

-- CreateTable
CREATE TABLE "public"."payment_service_payment_methods" (
    "paymentServiceId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "methodType" TEXT NOT NULL,

    CONSTRAINT "payment_service_payment_methods_pkey" PRIMARY KEY ("paymentServiceId","paymentMethodId","methodType")
);

-- CreateTable
CREATE TABLE "public"."payment_service_languages" (
    "paymentServiceId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,

    CONSTRAINT "payment_service_languages_pkey" PRIMARY KEY ("paymentServiceId","languageId")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."countries" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "flagUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currencies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."traffic_sources" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traffic_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."traffic_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traffic_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."balance_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exchange_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connection_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connection_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."languages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "flagUrl" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."translations" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "entityField" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "ownerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_services_name_key" ON "public"."payment_services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "offers_name_key" ON "public"."offers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "settings_name_key" ON "public"."settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "public"."countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_name_key" ON "public"."currencies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_sources_name_key" ON "public"."traffic_sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_types_name_key" ON "public"."traffic_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_name_key" ON "public"."payment_methods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "balance_types_name_key" ON "public"."balance_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_types_name_key" ON "public"."exchange_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "connection_types_name_key" ON "public"."connection_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "public"."languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_shortName_key" ON "public"."languages"("shortName");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "public"."languages"("code");

-- CreateIndex
CREATE INDEX "translations_lookup" ON "public"."translations"("entityType", "entityId", "entityField", "languageCode");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_services" ADD CONSTRAINT "payment_services_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_services" ADD CONSTRAINT "payment_services_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_services" ADD CONSTRAINT "payment_services_exchangeTypeId_fkey" FOREIGN KEY ("exchangeTypeId") REFERENCES "public"."exchange_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_services" ADD CONSTRAINT "payment_services_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_countries" ADD CONSTRAINT "offer_countries_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_countries" ADD CONSTRAINT "offer_countries_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_currencies" ADD CONSTRAINT "offer_currencies_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_currencies" ADD CONSTRAINT "offer_currencies_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_exchange_types" ADD CONSTRAINT "offer_exchange_types_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_exchange_types" ADD CONSTRAINT "offer_exchange_types_exchangeTypeId_fkey" FOREIGN KEY ("exchangeTypeId") REFERENCES "public"."exchange_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_payment_methods" ADD CONSTRAINT "offer_payment_methods_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_payment_methods" ADD CONSTRAINT "offer_payment_methods_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_traffic_sources" ADD CONSTRAINT "offer_traffic_sources_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_traffic_sources" ADD CONSTRAINT "offer_traffic_sources_trafficSourceId_fkey" FOREIGN KEY ("trafficSourceId") REFERENCES "public"."traffic_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_traffic_types" ADD CONSTRAINT "offer_traffic_types_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_traffic_types" ADD CONSTRAINT "offer_traffic_types_trafficTypeId_fkey" FOREIGN KEY ("trafficTypeId") REFERENCES "public"."traffic_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_balance_types" ADD CONSTRAINT "offer_balance_types_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_balance_types" ADD CONSTRAINT "offer_balance_types_balanceTypeId_fkey" FOREIGN KEY ("balanceTypeId") REFERENCES "public"."balance_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_connection_types" ADD CONSTRAINT "offer_connection_types_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_connection_types" ADD CONSTRAINT "offer_connection_types_connectionTypeId_fkey" FOREIGN KEY ("connectionTypeId") REFERENCES "public"."connection_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_payment_methods" ADD CONSTRAINT "PaymentServicePayInMethods_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_payment_methods" ADD CONSTRAINT "PaymentServicePayOutMethods_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_payment_methods" ADD CONSTRAINT "payment_service_payment_methods_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_languages" ADD CONSTRAINT "payment_service_languages_paymentServiceId_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_languages" ADD CONSTRAINT "payment_service_languages_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "public"."languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settings" ADD CONSTRAINT "settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."languages" ADD CONSTRAINT "languages_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."translations" ADD CONSTRAINT "translations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
