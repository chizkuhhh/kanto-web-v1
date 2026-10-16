import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { formatManilaDateTime, formatOrderNumber, formatPeso } from "@/lib/format"
import { STATUS_LABELS } from "@/lib/orderLabels"
import LalamoveLinkForm from "@/components/lalamoveLinkForm"
import LalamovePickupDetails from "@/components/lalamovePickupDetails"
import { isLinkWindowOpen, linkOpensAt } from "@/lib/lalamoveWindow"

export const dynamic = "force-dynamic"

// Order pages are private links and shouldn't appear in search results
export const metadata: Metadata = { robots: { index: false, follow: false } }

const card = "rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5"

function statusNoteFor(order: {
  status: string
  paymentMethod: string
  paymentProofKey: string | null
}) {
  if (order.status === "PENDING") {
    if (order.paymentMethod === "Cash on delivery")
      return "We've received your order. We'll confirm it and book your delivery soon."
    if (order.paymentProofKey) return "Screenshot received. Please wait while we confirm your payment."
    return "We're waiting for your payment."
  }

  const notes: Record<string, string> = {
    PAYMENT_CONFIRMED: "Payment received.",
    BOOKED: "Your parcel is booked for delivery.",
    DELIVERED: "Delivered. Thank you for ordering from Kanto PH!",
    CANCELLED: "This order was cancelled.",
  }
  return notes[order.status]
}

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: { items: true },
  })
  if (!order || order.personalDataPurgedAt) notFound()

  const isLalamove = order.deliveryMethod === "LALAMOVE"
  const shipping = Number(order.shippingFee)
  const codFee = Number(order.codFee ?? 0)
  const total = Number(order.productTotal) + shipping + codFee
  
  const linkOpen = isLinkWindowOpen(order.pickupAt)

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Status */}
        <div className={card}>
          <p className="text-sm text-mine-shaft-600">Order</p>
          <h1 className="text-2xl font-bold">{formatOrderNumber(order.orderNumber)}</h1>
          <p className="mt-1 text-sm text-mine-shaft-600">Placed {formatManilaDateTime(order.createdAt)}</p>
          <p className="mt-4 font-semibold">{STATUS_LABELS[order.status]}</p>
          <p className="text-sm">{statusNoteFor(order)}</p>
        </div>

        {/* Delivery */}
        <div className={card}>
          <h2 className="mb-2 font-bold">Delivery Details</h2>
          {isLalamove ? (
            <p className="text-sm">
              Pickup time:{" "}
              <strong>{order.pickupAt ? formatManilaDateTime(order.pickupAt) : "to be confirmed"}</strong>.
            </p>
          ) : (
            <p className="text-sm">
              {order.trackingNumber ? (
                <>
                  J&amp;T tracking number: <strong>{order.trackingNumber}</strong>
                </>
              ) : (
                "We'll send your J&T tracking number once it's booked."
              )}
            </p>
          )}
          {!isLalamove && order.address && (
            <p className="mt-3 text-sm text-mine-shaft-600">
              {order.address}, {order.city}, {order.province} {order.postalCode ?? ""}
            </p>
          )}
          
        </div>

        {isLalamove && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
        <div className={card}>
          <h2 className="mb-2 font-bold">Your Lalamove booking</h2>
          {order.status === "PENDING" ? (
            <p className="text-sm">Once we confirm your payment, you&apos;ll get the booking steps here.</p>
          ) : (
            <>
              <p className="text-sm">
                Book Lalamove for{" "}
                <strong>{order.pickupAt ? formatManilaDateTime(order.pickupAt) : "your chosen time"}</strong>.
                Set the pickup point to the details below, then paste your booking link.
              </p>
              <div className="mt-3">
                <LalamovePickupDetails />
              </div>
              <div className="mt-4">
                {linkOpen ? (
                  <LalamoveLinkForm token={token} existing={order.lalamoveLink} />
                ) : order.lalamoveLink ? (
                  <p className="text-sm">Booking link received. Thank you!</p>
                ) : (
                  <p className="text-sm">
                    The link box opens{" "}
                    <strong>{order.pickupAt ? formatManilaDateTime(linkOpensAt(order.pickupAt)) : "closer to pickup"}</strong>,
                    15 minutes before your pickup time.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

        {/* Items and totals */}
        <div className={card}>
          <h2 className="mb-3 font-bold">Items</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {order.items.map((item) => {
              const picks = Object.entries((item.selectedVariations ?? {}) as Record<string, string>)
              return (
                <li key={item.id} className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">{item.productName}</p>
                    {picks.length > 0 && (
                      <p className="text-mine-shaft-600">{picks.map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
                    )}
                    <p className="text-mine-shaft-500">
                      {item.quantity} × {formatPeso(Number(item.unitPrice))}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-semibold">
                    {formatPeso(Number(item.unitPrice) * item.quantity)}
                  </p>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex flex-col gap-1 border-t border-black-haze-200 pt-3 text-sm">
            <div className="flex justify-between">
              <span>Products</span>
              <span>{formatPeso(Number(order.productTotal))}</span>
            </div>
            {!isLalamove && (
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPeso(shipping)}</span>
              </div>
            )}
            {codFee > 0 && (
              <div className="flex justify-between">
                <span>COD fee</span>
                <span>{formatPeso(codFee)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatPeso(total)}</span>
            </div>
          </div>
        </div>

        <Link href="/catalog" className="self-center text-sm font-semibold underline underline-offset-2">
          Keep shopping
        </Link>
      </div>
    </div>
  )
}