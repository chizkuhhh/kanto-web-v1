import { prisma } from "@/lib/prisma"
import { formatOrderNumber } from "@/lib/format"
import { STATUS_LABELS } from "@/lib/orderLabels"
import { adminOrderUrl, escapeHtml, sendTelegram } from "@/lib/notify"

const STUCK_AFTER_MS = 24 * 3600_000
const MAX_LISTED = 20

// Start of today in Manila, as a real instant
function manilaStartOfToday(now: Date) {
  const shifted = new Date(now.getTime() + 8 * 3600_000)
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 8 * 3600_000,
  )
}

export async function sendDailyDigest(now: Date = new Date()) {
  const startOfToday = manilaStartOfToday(now)
  const stuckBefore = new Date(now.getTime() - STUCK_AFTER_MS)
  const stuckWhere = {
    status: { in: ["PENDING" as const, "PAYMENT_CONFIRMED" as const] },
    updatedAt: { lt: stuckBefore },
  }

  const [newToday, pending, unbookedJnt, stuckTotal, stuck] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PAYMENT_CONFIRMED", deliveryMethod: "JNT" } }),
    prisma.order.count({ where: stuckWhere }),
    prisma.order.findMany({
      where: stuckWhere,
      orderBy: { updatedAt: "asc" },
      take: MAX_LISTED,
      select: { id: true, orderNumber: true, status: true },
    }),
  ])

  const lines = [
    "<b>Daily summary</b>",
    `New today: ${newToday}`,
    `Pending payment: ${pending}`,
    `Paid, not booked (J&amp;T): ${unbookedJnt}`,
  ]

  if (stuckTotal > 0) {
    lines.push("", `<b>Waiting over 24 hours: ${stuckTotal}</b>`)
    for (const o of stuck) {
      const label = escapeHtml(formatOrderNumber(o.orderNumber))
      const status = escapeHtml(STATUS_LABELS[o.status] ?? o.status)
      lines.push(`<a href="${adminOrderUrl(o.id)}">${label}</a> · ${status}`)
    }
    if (stuckTotal > stuck.length) lines.push(`…and ${stuckTotal - stuck.length} more`)
  }

  return sendTelegram(lines.join("\n"))
}