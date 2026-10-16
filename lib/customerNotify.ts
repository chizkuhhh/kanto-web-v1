import { prisma } from "@/lib/prisma"
import { formatManilaDateTime, formatOrderNumber } from "@/lib/format"
import { sendText } from "@/lib/meta"
import { escapeHtml, sendTelegram } from "@/lib/notify"

const SITE_URL = "https://kanto-ph.com"
const SEMAPHORE_URL = "https://api.semaphore.co/api/v4/messages"

export type NotifyStatus = "PENDING" | "PAYMENT_CONFIRMED" | "BOOKED" | "DELIVERED" | "CANCELLED"

// Sends one SMS through Semaphore. With SMS_TRANSPORT=telegram, it posts the message to a Telegram group instead, for testing.
export async function sendSms(number: string, message: string) {
  if (process.env.SMS_TRANSPORT === "telegram") {
    const ok = await sendTelegram(
      `<b>[Test SMS] to ${escapeHtml(number)}</b>\n${escapeHtml(message)}`,
      process.env.TELEGRAM_SMS_CHAT_ID,
    )
    if (!ok) throw new Error("Telegram send failed")
    return
  }

  const apiKey = process.env.SEMAPHORE_API_KEY
  if (!apiKey) throw new Error("SEMAPHORE_API_KEY is not set")

  const body = new URLSearchParams({ apikey: apiKey, number, message })
  const sender = process.env.SEMAPHORE_SENDER_NAME
  if (sender) body.set("sendername", sender)

  const res = await fetch(SEMAPHORE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Semaphore returned ${res.status}: ${await res.text()}`)
}

function messageFor(
  status: NotifyStatus,
  o: {
    orderNumber: number
    trackingNumber: string | null
    deliveryMethod: string
    paymentMethod: string
    pickupAt: Date | null
    publicToken: string | null
  },
) {
  const n = formatOrderNumber(o.orderNumber)
  const trackUrl = o.publicToken ? `${SITE_URL}/order/${o.publicToken}` : null
  const track = trackUrl ? ` Track: ${trackUrl}` : ""

  switch (status) {
    case "PENDING":
      return o.paymentMethod === "Cash on delivery"
        ? `Kanto PH: We received ${n}. You'll pay the courier on delivery.${track}`
        : `Kanto PH: We received ${n}. We'll confirm your payment once we check your screenshot.${track}`

    case "PAYMENT_CONFIRMED": {
      if (o.deliveryMethod === "LALAMOVE") {
        const when = o.pickupAt ? formatManilaDateTime(o.pickupAt) : "your chosen time"
        return trackUrl
          ? `Kanto PH: Paid for ${n}. Book Lalamove for ${when}, then see pickup details and paste your booking link: ${trackUrl}`
          : `Kanto PH: Paid for ${n}. Book Lalamove for ${when}. Reply here with your booking link.`
      }
      return `Kanto PH: Payment received for ${n}. We're arranging your delivery.${track}`
    }

    case "BOOKED":
      return `Kanto PH: ${n} is booked for delivery.${o.trackingNumber ? ` J&T tracking: ${o.trackingNumber}.` : ""}${track}`

    case "DELIVERED":
      return `Kanto PH: ${n} has been delivered. Thank you for shopping with us!`

    case "CANCELLED":
      return `Kanto PH: ${n} was cancelled. Message us if you have questions.`
  }
}

// Tells the customer about an order event. Chat orders get a message in their thread,
// everything else gets an SMS to the phone number. Never throws, so an update can't fail because of a message.
export async function notifyCustomer(orderId: string, status: NotifyStatus) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      phone: true,
      trackingNumber: true,
      deliveryMethod: true,
      paymentMethod: true,
      pickupAt: true,
      publicToken: true,
      conversationId: true,
      conversation: { select: { senderId: true } },
    },
  })
  if (!order) return

  const text = messageFor(status, order)
  const via = order.conversationId && order.conversation ? "chat" : "SMS"

  try {
    if (via === "chat") {
      const messageId = await sendText(order.conversation!.senderId, text)
      await prisma.message.create({
        data: { conversationId: order.conversationId!, role: "agent", text, metaMessageId: messageId ?? null },
      })
    } else {
      await sendSms(order.phone, text)
    }

    await prisma.orderEvent.create({
      data: { orderId, fromStatus: null, toStatus: status, note: `Customer notified by ${via}` },
    })
  } catch (err) {
    console.error("Customer notify failed:", orderId, err)
    await prisma.orderEvent.create({
      data: { orderId, fromStatus: null, toStatus: status, note: `Customer notification failed (${via})` },
    })
  }
}