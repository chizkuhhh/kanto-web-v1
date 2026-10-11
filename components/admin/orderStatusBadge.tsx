import { STATUS_LABELS } from "@/lib/orderLabels"

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAYMENT_CONFIRMED: "bg-blue-100 text-blue-800",
  BOOKED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-black-haze-200 text-mine-shaft-600",
}

export default function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? ""}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}