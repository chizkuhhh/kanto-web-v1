-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAYMENT_CONFIRMED', 'BOOKED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('LALAMOVE', 'JNT');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('WEB', 'MESSENGER', 'INSTAGRAM', 'MANUAL');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "variations" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "weightGrams" INTEGER;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "channel" "Channel" NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "customerId" TEXT,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "productTotal" DECIMAL(10,2) NOT NULL,
    "shippingFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "codFee" DECIMAL(10,2),
    "pickupAt" TIMESTAMP(3),
    "trackingNumber" TEXT,
    "paymentReference" TEXT,
    "notes" TEXT,
    "personalDataPurgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "selectedVariations" JSONB,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JtZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinces" TEXT[],
    "lastCheckedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JtZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JtRate" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "maxWeightGrams" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "JtRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JtRate" ADD CONSTRAINT "JtRate_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "JtZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

