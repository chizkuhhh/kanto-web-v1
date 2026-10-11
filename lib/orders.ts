import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { DeliveryMethod, OrderStatus } from "@prisma/client"

// Lalamove orders are booked by the customer, so they skip BOOKED
export function getNextStatus(status: OrderStatus, deliveryMethod: DeliveryMethod): OrderStatus | null {
  switch (status) {
    case "PENDING":
      return "PAYMENT_CONFIRMED"
    case "PAYMENT_CONFIRMED":
      return deliveryMethod === "LALAMOVE" ? "DELIVERED" : "BOOKED"
    case "BOOKED":
      return "DELIVERED"
    default:
      return null
  }
}

export async function advanceOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } })
    const to = getNextStatus(order.status, order.deliveryMethod)
    if (!to) throw new Error("This order can't be advanced")

    // Only updates if the status hasn't changed since we read it
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: to },
    })
    if (count !== 1) throw new Error("This order was just changed. Refresh and try again.")

    await tx.orderEvent.create({
      data: { orderId, fromStatus: order.status, toStatus: to },
    })
    return to
  })
}

export async function cancelOrder(orderId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    })
    if (order.status === "DELIVERED" || order.status === "CANCELLED")
      throw new Error("This order can't be cancelled")

    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: "CANCELLED" },
    })
    if (count !== 1) throw new Error("This order was just changed. Refresh and try again.")

    // Return stock for items that were decremented at order time.
    // Older orders have no variantId, so they're skipped.
    for (const item of order.items) {
      if (!item.variantId) continue
      await tx.variant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }

    await tx.orderEvent.create({
      data: { orderId, fromStatus: order.status, toStatus: "CANCELLED", note: note || null },
    })
  })
}

const detailsSchema = z.object({
  trackingNumber: z.string().trim().max(60),
  paymentReference: z.string().trim().max(100),
  notes: z.string().trim().max(1000),
})

// Empty strings are stored as null so "not set" is consistent
export async function updateOrderDetails(
  orderId: string,
  input: { trackingNumber: string; paymentReference: string; notes: string },
) {
  const data = detailsSchema.parse(input)
  await prisma.order.update({
    where: { id: orderId },
    data: {
      trackingNumber: data.trackingNumber || null,
      paymentReference: data.paymentReference || null,
      notes: data.notes || null,
    },
  })
}