"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createManualOrder, lookupCustomerByPhone } from "@/lib/manualOrders"
import { notifyNewOrder } from "@/lib/notify"

async function requireAdmin() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
}

export async function lookupCustomerAction(phone: string) {
  await requireAdmin()
  return lookupCustomerByPhone(phone)
}

export async function createManualOrderAction(payload: string) {
  await requireAdmin()
  const order = await createManualOrder(JSON.parse(payload))
  await notifyNewOrder(order.id)
  revalidatePath("/admin/orders")
  redirect(`/admin/orders/${order.id}`)
}