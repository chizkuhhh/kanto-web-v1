"use server"

import { prisma } from "@/lib/prisma"
import { formatOrderNumber } from "@/lib/format"
import { adminOrderUrl, escapeHtml, sendTelegram } from "@/lib/notify"
import { isLinkWindowOpen, linkOpensAt } from "@/lib/lalamoveWindow"
import { formatManilaDateTime } from "@/lib/format"

export type LinkResult = { ok: true } | { ok: false; error: string }

const BAD_LINK = "Paste the full link, starting with https://"

// The customer pastes their Lalamove booking link on the tracking page
export async function saveLalamoveLinkAction(token: string, link: string): Promise<LinkResult> {
  const value = link.trim()
  if (value.length > 300) return { ok: false, error: BAD_LINK }
  try {
    if (new URL(value).protocol !== "https:") return { ok: false, error: BAD_LINK }
  } catch {
    return { ok: false, error: BAD_LINK }
  }

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    select: { id: true, orderNumber: true, deliveryMethod: true, status: true, pickupAt: true },
  })
  if (!order || order.deliveryMethod !== "LALAMOVE")
    return { ok: false, error: "This order doesn't need a Lalamove link." }
  if (order.status === "PENDING")
    return { ok: false, error: "We're still confirming your payment. Check back once it's confirmed." }
  if (order.status === "DELIVERED" || order.status === "CANCELLED")
    return { ok: false, error: "This order is already closed." }

  if (!isLinkWindowOpen(order.pickupAt))
  return {
    ok: false,
    error: `You can add the link from ${order.pickupAt ? formatManilaDateTime(linkOpensAt(order.pickupAt)) : "your pickup time"}, 15 minutes before pickup.`,
  }

  await prisma.order.update({ where: { id: order.id }, data: { lalamoveLink: value } })

  await sendTelegram(
    `<b>Lalamove link added</b>\n${escapeHtml(formatOrderNumber(order.orderNumber))}\n<a href="${adminOrderUrl(order.id)}">Open in admin</a>`,
  )
  return { ok: true }
}