import Link from "next/link"
import { Suspense } from "react"
import { Channel, OrderStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { formatManilaDateTime, formatOrderNumber, formatPeso } from "@/lib/format"
import { CHANNEL_LABELS, DELIVERY_LABELS, STATUS_LABELS } from "@/lib/orderLabels"
import OrderStatusBadge from "@/components/admin/orderStatusBadge"
import OrderFilters from "@/components/admin/orderFilters"

// Admin data must always be current, so never serve it from cache
export const dynamic = "force-dynamic"

const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
const channelOptions = Object.entries(CHANNEL_LABELS).map(([value, label]) => ({ value, label }))

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; channel?: string }>
}) {
  const { status, channel } = await searchParams

  // Only accept real enum values, so arbitrary URL input can't reach the query
  const statusFilter = Object.values(OrderStatus).find((s) => s === status)
  const channelFilter = Object.values(Channel).find((c) => c === channel)

  const orders = await prisma.order.findMany({
    where: {
      ...(statusFilter && { status: statusFilter }),
      ...(channelFilter && { channel: channelFilter }),
    },
    // Enum order follows declaration order in the schema:
    // PENDING, PAYMENT_CONFIRMED, BOOKED, DELIVERED, CANCELLED
    // so this puts orders needing attention first
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      channel: true,
      deliveryMethod: true,
      status: true,
      pickupAt: true,
      productTotal: true,
      shippingFee: true,
      codFee: true,
    },
    take: 200,
  })

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Orders</h1>
          <Suspense fallback={<div className="h-9 w-72" />}>
            <OrderFilters statuses={statusOptions} channels={channelOptions} />
          </Suspense>

          <form action="/admin/orders/export" method="get" className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col text-xs font-semibold text-mine-shaft-500">
              From
              <input type="date" name="from" required className="rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-xs font-semibold text-mine-shaft-500">
              To
              <input type="date" name="to" required className="rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm" />
            </label>
            <button type="submit" className="rounded-full px-4 h-10 text-sm font-semibold border border-black-haze-400 hover:bg-black-haze-200">
              Export CSV
            </button>
          </form>
        </div>

        {orders.length === 0 ? (
          <p className="mt-12 text-center text-mine-shaft-500">No orders match these filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black-haze-200 bg-black-haze-50">
            <table className="w-full text-sm">
              <thead className="bg-black-haze-100 text-left text-mine-shaft-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Channel</th>
                  <th className="px-4 py-3 font-semibold">Delivery</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Pickup</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const total =
                    Number(o.productTotal) + Number(o.shippingFee) + Number(o.codFee ?? 0)

                  return (
                    <tr key={o.id} className="border-t border-black-haze-200 hover:bg-black-haze-100">
                      <td className="px-4 py-3 font-semibold">
                        <Link href={`/admin/orders/${o.id}`} className="underline underline-offset-2">
                          {formatOrderNumber(o.orderNumber)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatManilaDateTime(o.createdAt)}</td>
                      <td className="px-4 py-3">{CHANNEL_LABELS[o.channel] ?? o.channel}</td>
                      <td className="px-4 py-3">{DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod}</td>
                      <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {o.deliveryMethod === "LALAMOVE" && o.pickupAt
                          ? formatManilaDateTime(o.pickupAt)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{formatPeso(total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-mine-shaft-500">Showing up to 200 orders.</p>
      </div>
    </div>
  )
}