import { prisma } from "@/lib/prisma"
import { formatOrderNumber, formatPeso } from "@/lib/format"
import { CHANNEL_LABELS, DELIVERY_LABELS } from "@/lib/orderLabels"

const TELEGRAM_API = "https://api.telegram.org"

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export const adminOrderUrl = (id: string) =>
  `${process.env.APP_URL}/admin/orders/${id}`

// Never throws. A failed alert shouldn't break order creation.
export async function sendTelegram(html: string, chatId = process.env.TELEGRAM_CHAT_ID) {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token || !chatId) {
    console.warn("Telegram is not configured; skipping alert")
    return false
  }

  try {
    const res = await fetch(
      `${TELEGRAM_API}/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: html,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        }),
        signal: AbortSignal.timeout(15000),
      },
    )

    if (!res.ok) {
      const body = await res.text()
      console.error("Telegram send failed:", res.status, body)
      return false
    }

    return true
  } catch (err) {
    console.error("Telegram error:", err)
    return false
  }
}

export async function notifyNewOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      channel: true,
      deliveryMethod: true,
      productTotal: true,
      shippingFee: true,
      codFee: true,
    },
  })
  if (!order) return

  const total =
    Number(order.productTotal) + Number(order.shippingFee) + Number(order.codFee ?? 0)

  const text = [
    `<b>New order ${escapeHtml(formatOrderNumber(order.orderNumber))}</b>`,
    `${escapeHtml(CHANNEL_LABELS[order.channel] ?? order.channel)} · ${escapeHtml(DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod)}`,
    `Total: ${escapeHtml(formatPeso(total))}`,
    `<a href="${adminOrderUrl(orderId)}">Open in admin</a>`,
  ].join("\n")

  await sendTelegram(text)
}