-- DropForeignKey
ALTER TABLE "public"."payment_service_languages" DROP CONSTRAINT "payment_service_languages_paymentServiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payment_service_payment_methods" DROP CONSTRAINT "PaymentServicePayInMethods_fkey";

-- DropForeignKey
ALTER TABLE "public"."payment_service_payment_methods" DROP CONSTRAINT "payment_service_payment_methods_paymentServiceId_fkey";

-- AddForeignKey
ALTER TABLE "public"."payment_service_payment_methods" ADD CONSTRAINT "PaymentServicePayInMethods_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_payment_methods" ADD CONSTRAINT "payment_service_payment_methods_paymentServiceId_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_service_languages" ADD CONSTRAINT "payment_service_languages_paymentServiceId_fkey" FOREIGN KEY ("paymentServiceId") REFERENCES "public"."payment_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
