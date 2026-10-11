"use server"

import { auth } from "@/auth"
import { advanceOrder, cancelOrder, updateOrderDetails } from "@/lib/orders"
import { revalidatePath } from "next/cache"

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
  await advanceOrder(orderId)
  refresh(orderId)
}

export async function cancelOrderAction(orderId: string, formData: FormData) {
  await requireAdmin()
  const note = String(formData.get("note") ?? "")
  await cancelOrder(orderId, note)
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