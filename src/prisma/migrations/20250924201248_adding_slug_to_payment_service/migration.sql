/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `payment_services` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `payment_services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."payment_services" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payment_services_slug_key" ON "public"."payment_services"("slug");
