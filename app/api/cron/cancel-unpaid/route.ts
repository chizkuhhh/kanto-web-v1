import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const UNPAID_AFTER_MS = 24 * 3600_000
const BATCH_SIZE = 50
const NOTE = "Auto-cancelled: not paid within 24 hours"

// Cancels one order only if it is still an unpaid self-service web order.
// The status check is part of the same write, so an order marked Paid a moment
// earlier can't be cancelled by mistake. Returns the stock for each item.
async function cancelIfStillUnpaid(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, channel: "WEB", selfService: true, status: "PENDING" },
      data: { status: "CANCELLED" },
    })
    if (count !== 1) return false

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    })
    for (const item of items) {
      // Older orders have no variantId, so there's no stock to return
      if (!item.variantId) continue
      await tx.variant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }

    await tx.orderEvent.create({
      data: { orderId, fromStatus: "PENDING", toStatus: "CANCELLED", note: NOTE },
    })
    return true
  })
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  // Refuse to run if the secret isn't configured, so an empty value can't match
  if (!secret) return new Response("CRON_SECRET is not set", { status: 500 })
  if (request.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 })

  const stale = await prisma.order.findMany({
    where: {
      channel: "WEB",
      selfService: true,
      status: "PENDING",
      paymentMethod: { not: "Cash on delivery" },
      createdAt: { lt: new Date(Date.now() - UNPAID_AFTER_MS) },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true },
  })

  let cancelled = 0
  const failed: string[] = []
  for (const order of stale) {
    try {
      if (await cancelIfStillUnpaid(order.id)) cancelled++
    } catch (err) {
      console.error("Auto-cancel failed:", order.id, err)
      failed.push(order.id)
    }
  }

  // Anything beyond the batch is picked up on the next run
  return Response.json({ found: stale.length, cancelled, failed })
}