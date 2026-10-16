import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getNextStatus } from "@/lib/orders"
import { formatManilaDateTime, formatOrderNumber, formatPeso } from "@/lib/format"
import { CHANNEL_LABELS, DELIVERY_LABELS, STATUS_LABELS } from "@/lib/orderLabels"
import OrderStatusBadge from "@/components/admin/orderStatusBadge"
import { advanceOrderAction, cancelOrderAction, updateOrderDetailsAction, updatePickupTimeAction } from "../actions"
import { getBookingSlots } from "@/lib/schedule"
import { proofViewUrl } from "@/lib/paymentProofs"
import CopyTrackingLink from "@/components/admin/copyTrackingLink"

export const dynamic = "force-dynamic"

const card = "rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5"
const label = "text-xs font-semibold uppercase tracking-wide text-mine-shaft-500"
const input = "w-full rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm"
const button =
  "rounded-full px-4 h-10 text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900"

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  })
  if (!order) notFound()

  const nextStatus = getNextStatus(order.status, order.deliveryMethod, order.paymentMethod)
  const canCancel = order.status !== "DELIVERED" && order.status !== "CANCELLED"
  const isPurged = order.personalDataPurgedAt !== null
  const total = Number(order.productTotal) + Number(order.shippingFee) + Number(order.codFee ?? 0)
  const proofUrl = order.paymentProofKey ? await proofViewUrl(order.paymentProofKey) : null
  const slots = getBookingSlots().map((s) => ({ value: s.startsAt.toISOString(), label: s.label }))

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <Link href="/admin/orders" className="text-sm text-mine-shaft-600 hover:text-mine-shaft-900">
          ← All orders
        </Link>

        {/* Header */}
        <div className={`${card} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <h1 className="text-2xl font-bold">{formatOrderNumber(order.orderNumber)}</h1>
            <p className="text-sm text-mine-shaft-600 mt-1">
              {formatManilaDateTime(order.createdAt)} · {CHANNEL_LABELS[order.channel] ?? order.channel} ·{" "}
              {DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {order.publicToken && (
              <CopyTrackingLink url={`https://kanto-ph.com/order/${order.publicToken}`} />
            )}
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Actions */}
        <div className={`${card} flex flex-wrap gap-3`}>
          {nextStatus && (
            <form action={advanceOrderAction.bind(null, order.id)}>
              <button type="submit" className={button}>
                Mark as {STATUS_LABELS[nextStatus]}
              </button>
            </form>
          )}
          {canCancel && (
            <form action={cancelOrderAction.bind(null, order.id)} className="flex flex-1 flex-wrap gap-2">
              <input
                name="note"
                placeholder="Reason (optional)"
                className={`${input} flex-1 min-w-48`}
              />
              <button type="submit" className="rounded-full px-4 h-10 text-sm font-semibold border border-red-300 text-red-700 hover:bg-red-50">
                Cancel order
              </button>
            </form>
          )}
          {!nextStatus && !canCancel && (
            <p className="text-sm text-mine-shaft-500">No further actions for this order.</p>
          )}
        </div>

        {/* Customer */}
        <div className={card}>
          <h2 className="font-bold mb-3">Customer</h2>
          {isPurged && (
            <p className="mb-3 text-xs text-amber-700">
              Personal details were removed on {formatManilaDateTime(order.personalDataPurgedAt!)} under the 3-month retention policy.
            </p>
          )}
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className={label}>Name</dt>
              <dd>{order.recipientName}</dd>
            </div>
            <div>
              <dt className={label}>Phone</dt>
              <dd>{order.phone}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className={label}>Address</dt>
              <dd>
                {order.address
                  ? <>{order.address}, {order.city}, {order.province} {order.postalCode ?? ""}</>
                  : "Lalamove: the customer books delivery to their own address"}
              </dd>
            </div>
            <div>
              <dt className={label}>Payment method</dt>
              <dd>{order.paymentMethod}</dd>
            </div>
          </dl>
        </div>

        {proofUrl && (
          <div className={card}>
            <h2 className="font-bold mb-2">Payment screenshot</h2>
            <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline">
              View screenshot (link expires in 10 minutes)
            </a>
            {order.paymentProofAt && (
              <p className="mt-1 text-xs text-mine-shaft-500">Uploaded {formatManilaDateTime(order.paymentProofAt)}</p>
            )}
          </div>
        )}

        {/* Delivery */}
        <div className={card}>
          <h2 className="font-bold mb-3">Delivery</h2>
          {order.deliveryMethod === "LALAMOVE" ? (
            <>
              <p className="text-sm">
                Customer books Lalamove.{" "}
                {order.pickupAt
                  ? <>Pickup time: <strong>{formatManilaDateTime(order.pickupAt)}</strong></>
                  : "No pickup time set."}
              </p>
              {order.lalamoveLink && (
                <p className="mt-2 text-sm">
                  <a href={order.lalamoveLink} target="_blank" rel="noopener noreferrer" className="underline">
                    Open customer&apos;s Lalamove booking
                  </a>
                </p>
              )}
            </>
          ) : (
            <p className="text-sm">You book J&amp;T. Enter the tracking number below once booked.</p>
          )}
        </div>

        {/* Pickup time: Lalamove only, until delivered or cancelled */}
        {order.deliveryMethod === "LALAMOVE" && canCancel && (
          <form action={updatePickupTimeAction.bind(null, order.id)} className={`${card} flex flex-col gap-3`}>
            <h2 className="font-bold">Pickup time</h2>
            <select name="pickupAt" required defaultValue={order.pickupAt?.toISOString() ?? ""} className={input}>
              <option value="">Choose a time</option>
              {order.pickupAt && !slots.some((s) => s.value === order.pickupAt!.toISOString()) && (
                <option value={order.pickupAt.toISOString()}>
                  {formatManilaDateTime(order.pickupAt)} (no longer open)
                </option>
              )}
              {slots.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div>
              <button type="submit" className={button}>Save pickup time</button>
            </div>
          </form>
        )}

        {/* Items */}
        <div className={card}>
          <h2 className="font-bold mb-3">Items</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {order.items.map((item) => {
              const picks =
                item.selectedVariations && typeof item.selectedVariations === "object"
                  ? Object.entries(item.selectedVariations as Record<string, string>)
                  : []
              return (
                <li key={item.id} className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">{item.productName}</p>
                    {picks.length > 0 && (
                      <p className="text-mine-shaft-600">
                        {picks.map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                    <p className="text-mine-shaft-500">
                      {item.quantity} × {formatPeso(Number(item.unitPrice))}
                    </p>
                  </div>
                  <p className="font-semibold whitespace-nowrap">
                    {formatPeso(Number(item.unitPrice) * item.quantity)}
                  </p>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 border-t border-black-haze-200 pt-3 text-sm flex flex-col gap-1">
            <div className="flex justify-between"><span>Products</span><span>{formatPeso(Number(order.productTotal))}</span></div>
            {order.deliveryMethod === "JNT" && (
              <div className="flex justify-between"><span>Shipping</span><span>{formatPeso(Number(order.shippingFee))}</span></div>
            )}
            {Number(order.codFee ?? 0) > 0 && (
              <div className="flex justify-between"><span>COD fee</span><span>{formatPeso(Number(order.codFee))}</span></div>
            )}
            <div className="flex justify-between font-bold text-base mt-1"><span>Total</span><span>{formatPeso(total)}</span></div>
          </div>
        </div>

        {/* Editable details */}
        <form action={updateOrderDetailsAction.bind(null, order.id)} className={`${card} flex flex-col gap-4`}>
          <h2 className="font-bold">Details</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className={label}>Tracking number (J&amp;T)</span>
            <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className={label}>Payment reference</span>
            <input name="paymentReference" defaultValue={order.paymentReference ?? ""} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className={label}>Notes</span>
            <textarea name="notes" rows={3} defaultValue={order.notes ?? ""} className={input} />
          </label>
          <div>
            <button type="submit" className={button}>Save details</button>
          </div>
        </form>

        {/* History */}
        <div className={card}>
          <h2 className="font-bold mb-3">History</h2>
          <ol className="flex flex-col gap-2 text-sm">
            {order.events.map((e) => (
              <li key={e.id} className="flex flex-col">
                <span>
                  {e.fromStatus ? `${STATUS_LABELS[e.fromStatus]} → ` : ""}
                  <strong>{STATUS_LABELS[e.toStatus]}</strong>
                </span>
                <span className="text-xs text-mine-shaft-500">
                  {formatManilaDateTime(e.createdAt)}
                  {e.note ? ` · ${e.note}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}