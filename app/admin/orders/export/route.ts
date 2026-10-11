import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { formatManilaDateTime, formatOrderNumber } from "@/lib/format"
import { CHANNEL_LABELS, DELIVERY_LABELS, STATUS_LABELS } from "@/lib/orderLabels"

export const dynamic = "force-dynamic"

const DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_DAYS = 366

// Quotes the value, and prefixes formula-like text so spreadsheets don't run it
function csvCell(value: unknown) {
  let s = value == null ? "" : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return `"${s.replace(/"/g, '""')}"`
}

const HEADERS = [
  "Order",
  "Created (Manila)",
  "Channel",
  "Delivery",
  "Status",
  "Payment",
  "Product total",
  "Shipping",
  "COD fee",
  "Total",
  "Pickup (Manila)",
  "Tracking number",
  "Payment reference",
]

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const url = new URL(request.url)
  const from = url.searchParams.get("from") ?? ""
  const to = url.searchParams.get("to") ?? ""
  if (!DATE.test(from) || !DATE.test(to))
    return new Response("Use from and to dates in YYYY-MM-DD format", { status: 400 })

  // Dates are Manila days, so convert using the +08:00 offset
  const start = new Date(`${from}T00:00:00+08:00`)
  const end = new Date(`${to}T23:59:59.999+08:00`)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end)
    return new Response("Invalid date range", { status: 400 })
  if (end.getTime() - start.getTime() > MAX_DAYS * 24 * 3600_000)
    return new Response(`Export ranges can be at most ${MAX_DAYS} days`, { status: 400 })

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { orderNumber: "asc" },
    select: {
      orderNumber: true,
      createdAt: true,
      channel: true,
      deliveryMethod: true,
      status: true,
      paymentMethod: true,
      productTotal: true,
      shippingFee: true,
      codFee: true,
      pickupAt: true,
      trackingNumber: true,
      paymentReference: true,
    },
  })

  const rows = orders.map((o) => {
    const total = new Prisma.Decimal(o.productTotal).add(o.shippingFee).add(o.codFee ?? 0)
    return [
      formatOrderNumber(o.orderNumber),
      formatManilaDateTime(o.createdAt),
      CHANNEL_LABELS[o.channel] ?? o.channel,
      DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod,
      STATUS_LABELS[o.status] ?? o.status,
      o.paymentMethod,
      o.productTotal.toFixed(2),
      o.shippingFee.toFixed(2),
      o.codFee ? o.codFee.toFixed(2) : "",
      total.toFixed(2),
      o.pickupAt ? formatManilaDateTime(o.pickupAt) : "",
      o.trackingNumber ?? "",
      o.paymentReference ?? "",
    ]
  })

  // Cancelled orders are included with their status, so you can filter them in the spreadsheet
  const body = [HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")

  return new Response("\ufeff" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kanto-orders-${from}-to-${to}.csv"`,
    },
  })
}