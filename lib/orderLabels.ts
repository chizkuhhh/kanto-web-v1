export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAYMENT_CONFIRMED: "Paid",
  BOOKED: "Booked",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

export const CHANNEL_LABELS: Record<string, string> = {
  WEB: "Website",
  MESSENGER: "Messenger",
  INSTAGRAM: "Instagram",
  MANUAL: "Manual",
}

export const DELIVERY_LABELS: Record<string, string> = {
  LALAMOVE: "Lalamove",
  JNT: "J&T",
}

export const PAYMENT_METHODS = [
  "GCash",
  "Maya",
  "BDO bank transfer",
  "Security Bank transfer",
  "Cash on delivery",
] as const