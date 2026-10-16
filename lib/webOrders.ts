import { z } from "zod"
import { createManualOrder } from "@/lib/manualOrders"
import { notifyNewOrder } from "@/lib/notify"
import { PAYMENT_METHODS } from "@/lib/orderLabels"
import { verifyProof } from "@/lib/paymentProofs"
import { notifyCustomer } from "@/lib/customerNotify"

const COD = "Cash on delivery"

const webInput = z.object({
  deliveryMethod: z.enum(["LALAMOVE", "JNT"]),
  paymentMethod: z.enum(PAYMENT_METHODS),
  name: z.string().trim().min(1).max(100),
  phone: z.string(),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  province: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().max(10),
  notes: z.string().trim().max(1000),
  pickupAt: z.string().optional(),
  lalamoveAccepted: z.literal(true).optional(),
  paymentProofKey: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        variations: z.record(z.string(), z.string()),
      }),
    )
    .min(1)
    .max(20),
})

// Public checkout. Everything the customer sends is re-checked by createManualOrder.
export async function placeWebOrder(raw: unknown) {
  const input = webInput.parse(raw)
  const isLalamove = input.deliveryMethod === "LALAMOVE"

  if (isLalamove) {
    if (!input.lalamoveAccepted) throw new Error("Please accept the Lalamove booking note first")
    if (input.paymentMethod === COD) throw new Error("Cash on delivery isn't available with Lalamove")
    if (!input.pickupAt) throw new Error("Choose a pickup time for Lalamove orders")
  }

  const needsProof = input.paymentMethod === "GCash" || input.paymentMethod === "Bank transfer"
  if (needsProof) {
    if (!input.paymentProofKey) throw new Error("Please upload your payment screenshot")
    await verifyProof(input.paymentProofKey)
  }

  const order = await createManualOrder(
    {
      ...input,
      channel: "WEB",
      pickupAt: isLalamove ? input.pickupAt : undefined,
    },
    {
      selfService: true,
      lalamoveAcceptedAt: isLalamove ? new Date() : undefined,
      paymentProofKey: needsProof ? input.paymentProofKey : undefined,
      paymentProofAt: needsProof ? new Date() : undefined,
    },
  )

  await notifyCustomer(order.id, "PENDING")
  
  await notifyNewOrder(order.id)

  return {
    orderNumber: order.orderNumber,
    publicToken: order.publicToken,
  }
}