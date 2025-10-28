-- AlterTable
ALTER TABLE "public"."payment_services" ADD COLUMN     "offerIds" INTEGER[];

-- CreateTable
CREATE TABLE "public"."payment_service_offers" (
    "paymentServiceId" INTEGER NOT NULL,
    "offerId" INTEGER NOT NULL,

    CONSTRAINT "payment_service_offers_pkey" PRIMARY KEY ("paymentServiceId","offerId")
);

-- AddForeignKey
ALTER TABLE "public"."payment_service_offers" ADD CONSTRAINT "payment_service_offers_paymentServiceId_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_offers" ADD CONSTRAINT "payment_service_offers_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
