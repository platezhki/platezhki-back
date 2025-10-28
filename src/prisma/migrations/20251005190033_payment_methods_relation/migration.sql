/*
  Warnings:

  - You are about to drop the column `paymentMethodId` on the `offers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."offers" DROP CONSTRAINT "offers_paymentMethodId_fkey";

-- AlterTable
ALTER TABLE "public"."offers" DROP COLUMN "paymentMethodId",
ALTER COLUMN "payInFee" DROP NOT NULL,
ALTER COLUMN "payOutFee" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."offer_payment_methods" (
    "offerId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,

    CONSTRAINT "offer_payment_methods_pkey" PRIMARY KEY ("offerId","paymentMethodId")
);

-- AddForeignKey
ALTER TABLE "public"."offer_payment_methods" ADD CONSTRAINT "offer_payment_methods_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_payment_methods" ADD CONSTRAINT "offer_payment_methods_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
