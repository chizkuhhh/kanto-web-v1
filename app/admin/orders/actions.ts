"use server"

import { auth } from "@/auth"
import { advanceOrder, cancelOrder, updateOrderDetails, updatePickupTime } from "@/lib/orders"
import { revalidatePath } from "next/cache"
import { notifyCustomer } from "@/lib/customerNotify"

async function requireAdmin() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
}

function refresh(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
}

export async function advanceOrderAction(orderId: string) {
  await requireAdmin()
  const to = await advanceOrder(orderId)
  if (to === "PAYMENT_CONFIRMED" || to === "BOOKED" || to === "DELIVERED") await notifyCustomer(orderId, to)
  refresh(orderId)
}

export async function cancelOrderAction(orderId: string, formData: FormData) {
  await requireAdmin()
  const note = String(formData.get("note") ?? "")
  await cancelOrder(orderId, note)
  await notifyCustomer(orderId, "CANCELLED")
  refresh(orderId)
}

export async function updateOrderDetailsAction(orderId: string, formData: FormData) {
  await requireAdmin()
  await updateOrderDetails(orderId, {
    trackingNumber: String(formData.get("trackingNumber") ?? ""),
    paymentReference: String(formData.get("paymentReference") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  })
  refresh(orderId)
}

export async function updatePickupTimeAction(orderId: string, formData: FormData) {
  await requireAdmin()
  const raw = String(formData.get("pickupAt") ?? "")
  const pickupAt = new Date(raw)
  if (!raw || Number.isNaN(pickupAt.getTime())) throw new Error("Choose a pickup time")
  await updatePickupTime(orderId, pickupAt)
  refresh(orderId)
}