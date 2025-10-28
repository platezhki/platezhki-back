-- CreateTable
CREATE TABLE "public"."offer_balance_types" (
    "offerId" INTEGER NOT NULL,
    "balanceTypeId" INTEGER NOT NULL,

    CONSTRAINT "offer_balance_types_pkey" PRIMARY KEY ("offerId","balanceTypeId")
);

-- AddForeignKey
ALTER TABLE "public"."offer_balance_types" ADD CONSTRAINT "offer_balance_types_balanceTypeId_fkey" FOREIGN KEY ("balanceTypeId") REFERENCES "public"."balance_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_balance_types" ADD CONSTRAINT "offer_balance_types_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
