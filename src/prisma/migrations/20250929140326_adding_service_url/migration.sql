-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_ownerId_fkey";

-- AlterTable
ALTER TABLE "public"."payment_services" ADD COLUMN     "serviceUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "ownerId" DROP NOT NULL;

-- RenameForeignKey (conditional - only if constraint exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PaymentServicePayOutMethods_fkey' 
        AND table_name = 'payment_service_payment_methods'
    ) THEN
        ALTER TABLE "public"."payment_service_payment_methods" RENAME CONSTRAINT "PaymentServicePayOutMethods_fkey" TO "payment_service_payment_methods_paymentServiceId_fkey";
    END IF;
END $$;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
