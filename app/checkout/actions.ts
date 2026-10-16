"use server"

import { Prisma } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getJtFee } from "@/lib/jt"
import { normalizePhone } from "@/lib/manualOrders"
import { placeWebOrder } from "@/lib/webOrders"
import { verifyTurnstile } from "@/lib/turnstile"
import { createProofUpload } from "@/lib/paymentProofs"

const MAX_ORDERS_PER_HOUR = 3

export type PlaceResult = { ok: true; publicToken: string } | { ok: false; error: string }
export type QuoteResult =
  | { ok: true; shippingFee: string; codFee: string | null }
  | { ok: false; error: string }

// Our own messages are written for customers. Database and parsing errors are not.
function userMessage(err: unknown) {
  if (err instanceof z.ZodError || err instanceof SyntaxError)
    return "Please check the details you entered."
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientValidationError
  )
    return "Something went wrong. Please try again."
  if (err instanceof Error) return err.message
  return "Something went wrong. Please try again."
}

export async function placeWebOrderAction(payload: string, turnstileToken?: string): Promise<PlaceResult> {
  try {
    await verifyTurnstile(turnstileToken)

    const data = JSON.parse(payload)
    const phone = normalizePhone(String(data.phone ?? ""))
    const recent = await prisma.order.count({
      where: { channel: "WEB", phone, createdAt: { gte: new Date(Date.now() - 3600_000) } },
    })
    if (recent >= MAX_ORDERS_PER_HOUR)
      return { ok: false, error: "Too many orders from this number in the last hour. Please try again later." }

    const order = await placeWebOrder(data)
    if (!order.publicToken) return { ok: false, error: "Something went wrong. Please try again." }
    return { ok: true, publicToken: order.publicToken }
  } catch (err) {
    console.error("Web order failed:", err)
    return { ok: false, error: userMessage(err) }
  }
}

const QUOTE_REASON: Record<string, string> = {
  invalid_weight: "A product in your cart is missing its weight. Please contact us.",
  unknown_province: "J&T can't deliver to this province or city. Check the spelling, or choose Lalamove.",
  over_max_weight: "This order is over J&T's 5 kg limit. Please contact us to arrange it.",
}

// Shipping quote for the checkout form. Prices and weights come from the database.
export async function quoteShippingAction(input: {
  province: string
  city: string
  paymentMethod: string
  items: { productId: string; quantity: number }[]
}): Promise<QuoteResult> {
  try {
    const products = await prisma.product.findMany({
      where: { id: { in: input.items.map((i) => i.productId) } },
    })
    const byId = new Map(products.map((p) => [p.id, p]))

    let productTotal = new Prisma.Decimal(0)
    let grams = 0
    for (const item of input.items) {
      const p = byId.get(item.productId)
      if (!p || !p.price || !p.weightGrams)
        return { ok: false, error: "A product in your cart is no longer available." }
      productTotal = productTotal.add(p.price.mul(item.quantity))
      grams += p.weightGrams * item.quantity
    }

    const quote = await getJtFee({
      province: input.province,
      city: input.city,
      weightGrams: grams,
      declaredAmount: input.paymentMethod === "Cash on delivery" ? productTotal : undefined,
    })
    if (!quote.ok) return { ok: false, error: QUOTE_REASON[quote.reason] ?? "J&T can't quote this order." }

    return {
      ok: true,
      shippingFee: quote.shippingFee.toFixed(2),
      codFee: quote.codFee ? quote.codFee.toFixed(2) : null,
    }
  } catch (err) {
    console.error("Shipping quote failed:", err)
    return { ok: false, error: "Couldn't calculate shipping. Please try again." }
  }
}

// The checkout page calls this first, then uploads the file to the URL it gets back
export async function createProofUploadAction(contentType: string) {
  try {
    const upload = await createProofUpload(contentType)
    return { ok: true as const, ...upload }
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Upload failed." }
  }
}