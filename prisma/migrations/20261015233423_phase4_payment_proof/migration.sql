/*
  Warnings:

  - A unique constraint covering the columns `[paymentProofKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentProofAt" TIMESTAMP(3),
ADD COLUMN     "paymentProofKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentProofKey_key" ON "Order"("paymentProofKey");
