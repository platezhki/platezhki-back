-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentService" (
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

    CONSTRAINT "PaymentService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Offer" (
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

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OfferCountry" (
    "offerId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "OfferCountry_pkey" PRIMARY KEY ("offerId","countryId")
);

-- CreateTable
CREATE TABLE "public"."OfferCurrency" (
    "offerId" INTEGER NOT NULL,
    "currencyId" INTEGER NOT NULL,

    CONSTRAINT "OfferCurrency_pkey" PRIMARY KEY ("offerId","currencyId")
);

-- CreateTable
CREATE TABLE "public"."OfferExchangeType" (
    "offerId" INTEGER NOT NULL,
    "exchangeTypeId" INTEGER NOT NULL,

    CONSTRAINT "OfferExchangeType_pkey" PRIMARY KEY ("offerId","exchangeTypeId")
);

-- CreateTable
CREATE TABLE "public"."OfferPaymentMethod" (
    "offerId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,

    CONSTRAINT "OfferPaymentMethod_pkey" PRIMARY KEY ("offerId","paymentMethodId")
);

-- CreateTable
CREATE TABLE "public"."OfferTrafficSource" (
    "offerId" INTEGER NOT NULL,
    "trafficSourceId" INTEGER NOT NULL,

    CONSTRAINT "OfferTrafficSource_pkey" PRIMARY KEY ("offerId","trafficSourceId")
);

-- CreateTable
CREATE TABLE "public"."OfferTrafficType" (
    "offerId" INTEGER NOT NULL,
    "trafficTypeId" INTEGER NOT NULL,

    CONSTRAINT "OfferTrafficType_pkey" PRIMARY KEY ("offerId","trafficTypeId")
);

-- CreateTable
CREATE TABLE "public"."OfferBalanceType" (
    "offerId" INTEGER NOT NULL,
    "balanceTypeId" INTEGER NOT NULL,

    CONSTRAINT "OfferBalanceType_pkey" PRIMARY KEY ("offerId","balanceTypeId")
);

-- CreateTable
CREATE TABLE "public"."OfferConnectionType" (
    "offerId" INTEGER NOT NULL,
    "connectionTypeId" INTEGER NOT NULL,

    CONSTRAINT "OfferConnectionType_pkey" PRIMARY KEY ("offerId","connectionTypeId")
);

-- CreateTable
CREATE TABLE "public"."PaymentServicePaymentMethod" (
    "paymentServiceId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "methodType" TEXT NOT NULL,

    CONSTRAINT "PaymentServicePaymentMethod_pkey" PRIMARY KEY ("paymentServiceId","paymentMethodId","methodType")
);

-- CreateTable
CREATE TABLE "public"."PaymentServiceLanguage" (
    "paymentServiceId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,

    CONSTRAINT "PaymentServiceLanguage_pkey" PRIMARY KEY ("paymentServiceId","languageId")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "flagUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Currency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrafficSource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrafficSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrafficType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrafficType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentMethod" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BalanceType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BalanceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExchangeType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConnectionType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Language" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "flagUrl" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Translation" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "entityField" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "ownerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentService_name_key" ON "public"."PaymentService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_name_key" ON "public"."Offer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_name_key" ON "public"."Setting"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "public"."Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_name_key" ON "public"."Currency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrafficSource_name_key" ON "public"."TrafficSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrafficType_name_key" ON "public"."TrafficType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "public"."PaymentMethod"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BalanceType_name_key" ON "public"."BalanceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeType_name_key" ON "public"."ExchangeType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionType_name_key" ON "public"."ConnectionType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "public"."Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_shortName_key" ON "public"."Language"("shortName");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "public"."Language"("code");

-- CreateIndex
CREATE INDEX "translations_lookup" ON "public"."Translation"("entityType", "entityId", "entityField", "languageCode");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentService" ADD CONSTRAINT "PaymentService_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentService" ADD CONSTRAINT "PaymentService_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentService" ADD CONSTRAINT "PaymentService_exchangeTypeId_fkey" FOREIGN KEY ("exchangeTypeId") REFERENCES "public"."ExchangeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentService" ADD CONSTRAINT "PaymentService_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Offer" ADD CONSTRAINT "Offer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferCountry" ADD CONSTRAINT "OfferCountry_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferCountry" ADD CONSTRAINT "OfferCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferCurrency" ADD CONSTRAINT "OfferCurrency_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferCurrency" ADD CONSTRAINT "OfferCurrency_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferExchangeType" ADD CONSTRAINT "OfferExchangeType_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferExchangeType" ADD CONSTRAINT "OfferExchangeType_exchangeTypeId_fkey" FOREIGN KEY ("exchangeTypeId") REFERENCES "public"."ExchangeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferPaymentMethod" ADD CONSTRAINT "OfferPaymentMethod_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferPaymentMethod" ADD CONSTRAINT "OfferPaymentMethod_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferTrafficSource" ADD CONSTRAINT "OfferTrafficSource_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferTrafficSource" ADD CONSTRAINT "OfferTrafficSource_trafficSourceId_fkey" FOREIGN KEY ("trafficSourceId") REFERENCES "public"."TrafficSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferTrafficType" ADD CONSTRAINT "OfferTrafficType_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferTrafficType" ADD CONSTRAINT "OfferTrafficType_trafficTypeId_fkey" FOREIGN KEY ("trafficTypeId") REFERENCES "public"."TrafficType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferBalanceType" ADD CONSTRAINT "OfferBalanceType_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferBalanceType" ADD CONSTRAINT "OfferBalanceType_balanceTypeId_fkey" FOREIGN KEY ("balanceTypeId") REFERENCES "public"."BalanceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferConnectionType" ADD CONSTRAINT "OfferConnectionType_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OfferConnectionType" ADD CONSTRAINT "OfferConnectionType_connectionTypeId_fkey" FOREIGN KEY ("connectionTypeId") REFERENCES "public"."ConnectionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentServicePaymentMethod" ADD CONSTRAINT "PaymentServicePayInMethods_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."PaymentService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentServicePaymentMethod" ADD CONSTRAINT "PaymentServicePayOutMethods_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."PaymentService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentServicePaymentMethod" ADD CONSTRAINT "PaymentServicePaymentMethod_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentServiceLanguage" ADD CONSTRAINT "PaymentServiceLanguage_paymentServiceId_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."PaymentService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentServiceLanguage" ADD CONSTRAINT "PaymentServiceLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Setting" ADD CONSTRAINT "Setting_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Language" ADD CONSTRAINT "Language_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Translation" ADD CONSTRAINT "Translation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
