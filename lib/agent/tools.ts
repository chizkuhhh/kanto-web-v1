import type Anthropic from "@anthropic-ai/sdk"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getBookingSlots } from "@/lib/schedule"
import { getJtFee } from "@/lib/jt"
import { createManualOrder } from "@/lib/manualOrders"
import { escapeHtml, notifyNewOrder, sendTelegram } from "@/lib/notify"
import { formatOrderNumber } from "@/lib/format"
import { PAYMENT_METHODS } from "@/lib/orderLabels"
import { setConversationOpen } from "@/lib/chatwoot"

export type ToolContext = {
  conversationId: string
  channel: "MESSENGER" | "INSTAGRAM"
  chatwoot?: { accountId: number; conversationId: number }
}

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

// ---- search_products ----
const searchInput = z.object({ query: z.string().max(100) })

async function searchProducts(raw: unknown) {
  const { query } = searchInput.parse(raw)
  const products = await prisma.product.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: 5,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      variations: true,
      variants: { where: { active: true, stock: { gt: 0 } }, select: { options: true } },
    },
  })

  return products.map((p) => ({
    productId: p.id,
    name: p.name,
    price: p.price ? p.price.toString() : null,
    description: stripHtml(p.description).slice(0, 200),
    options: p.variations,
    availableCombinations: p.variants.map((v) => v.options),
  }))
}

// ---- get_pickup_slots ----
async function getPickupSlots() {
  return getBookingSlots().map((s) => ({ id: s.startsAt.toISOString(), label: s.label }))
}

// ---- get_jt_fee ----
const jtInput = z.object({
  province: z.string().min(1).max(100),
  city: z.string().max(100).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(50) }))
    .min(1)
    .max(20),
})

async function getJtFeeTool(raw: unknown) {
  const input = jtInput.parse(raw)
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  let productTotal = new Prisma.Decimal(0)
  let grams = 0
  for (const item of input.items) {
    const p = byId.get(item.productId)
    if (!p || !p.price || !p.weightGrams) return { ok: false, reason: "missing_product_data" }
    productTotal = productTotal.add(p.price.mul(item.quantity))
    grams += p.weightGrams * item.quantity
  }

  const quote = await getJtFee({
    province: input.province,
    city: input.city,
    weightGrams: grams,
    declaredAmount: input.paymentMethod === "Cash on delivery" ? productTotal : undefined,
  })
  if (!quote.ok) return { ok: false, reason: quote.reason }

  return {
    ok: true,
    zone: quote.zone,
    productTotal: productTotal.toFixed(2),
    shippingFee: quote.shippingFee.toFixed(2),
    codFee: quote.codFee ? quote.codFee.toFixed(2) : null,
  }
}

// ---- save_order ----
const saveInput = z.object({
  customerConfirmed: z.literal(true),
  name: z.string().min(1).max(100),
  phone: z.string(),
  address: z.string().max(200).default(""),
  city: z.string().max(100).default(""),
  province: z.string().max(100).default(""),
  postalCode: z.string().max(10).optional(),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  deliveryMethod: z.enum(["LALAMOVE", "JNT"]),
  lalamoveDisclaimerAccepted: z.boolean().optional(),
  pickupAt: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(50),
        variations: z.record(z.string(), z.string()),
      }),
    )
    .min(1)
    .max(20),
})

async function saveOrder(ctx: ToolContext, raw: unknown) {
  const input = saveInput.parse(raw)
  if (input.deliveryMethod === "LALAMOVE" && input.lalamoveDisclaimerAccepted !== true)
    throw new Error("The Lalamove disclaimer must be shown and accepted before saving this order")

  // createManualOrder re-validates everything: prices, weights, variations, pickup slot, and stock
  const order = await createManualOrder(
    {
      channel: ctx.channel,
      deliveryMethod: input.deliveryMethod,
      paymentMethod: input.paymentMethod,
      name: input.name,
      phone: input.phone,
      address: input.address,
      city: input.city,
      province: input.province,
      postalCode: input.postalCode ?? "",
      notes: input.notes ?? "",
      pickupAt: input.pickupAt,
      items: input.items,
    },
    {
      conversationId: ctx.conversationId,
      lalamoveAcceptedAt: input.deliveryMethod === "LALAMOVE" ? new Date() : undefined,
    },
  )
  await notifyNewOrder(order.id)

  return {
    orderNumber: formatOrderNumber(order.orderNumber),
    status: "PENDING",
    message: "Order saved. Staff will confirm payment and delivery details.",
  }
}

// ---- handoff_to_human ----
const handoffInput = z.object({ reason: z.string().min(1).max(300) })

async function handoff(ctx: ToolContext, raw: unknown) {
  const { reason } = handoffInput.parse(raw)
  await prisma.conversation.update({
    where: { id: ctx.conversationId },
    data: { botPaused: true },
  })
  let where = `Conversation: ${escapeHtml(ctx.conversationId)}`
  if (ctx.chatwoot) {
    // Open the conversation in Chatwoot so a human picks it up and the bot stops receiving it
    await setConversationOpen(ctx.chatwoot.accountId, ctx.chatwoot.conversationId).catch((err) =>
      console.error("Chatwoot handoff failed:", err),
    )
    const base = (process.env.CHATWOOT_BASE_URL ?? "").replace(/\/$/, "")
    const url = `${base}/app/accounts/${ctx.chatwoot.accountId}/conversations/${ctx.chatwoot.conversationId}`
    where = `<a href="${url}">Open in Chatwoot</a>`
  }
  await sendTelegram(`<b>Handoff needed</b>\n${escapeHtml(reason)}\n${where}`)
  return { handedOff: true }
}

// ---- dispatcher ----
export async function runTool(name: string, input: unknown, ctx: ToolContext) {
  switch (name) {
    case "search_products":
      return searchProducts(input)
    case "get_pickup_slots":
      return getPickupSlots()
    case "get_jt_fee":
      return getJtFeeTool(input)
    case "save_order":
      return saveOrder(ctx, input)
    case "handoff_to_human":
      return handoff(ctx, input)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// ---- tool definitions the model sees ----
export const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_products",
    description:
      "Search the catalog by name (empty query lists products). Returns prices, variation types, and availableCombinations (the options currently in stock). Empty availableCombinations means out of stock.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "get_pickup_slots",
    description: "List open Lalamove pickup times. Show the labels; pass the chosen id as pickupAt.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_jt_fee",
    description:
      "Quote the J&T shipping fee (and COD fee if paying cash on delivery) for a province and cart. Returns ok:false if a quote isn't possible; then hand off.",
    input_schema: {
      type: "object",
      properties: {
        province: { type: "string" },
        city: { type: "string" },
        paymentMethod: { type: "string", enum: [...PAYMENT_METHODS] },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              productId: { type: "string" },
              quantity: { type: "integer" },
            },
            required: ["productId", "quantity"],
          },
        },
      },
      required: ["province", "paymentMethod", "items"],
    },
  },
  {
    name: "save_order",
    description:
      "Save a confirmed order as PENDING. Only call after the customer explicitly confirmed the summary. Set customerConfirmed to true only then. For Lalamove, set lalamoveDisclaimerAccepted only after the customer replied I understand. Address, city, and province are required for J&T and should be left empty for Lalamove.",
    input_schema: {
      type: "object",
      properties: {
        customerConfirmed: { type: "boolean" },
        name: { type: "string" },
        phone: { type: "string" },
        address: { type: "string" },
        city: { type: "string" },
        province: { type: "string" },
        postalCode: { type: "string" },
        notes: { type: "string" },
        paymentMethod: { type: "string", enum: [...PAYMENT_METHODS] },
        deliveryMethod: { type: "string", enum: ["LALAMOVE", "JNT"] },
        lalamoveDisclaimerAccepted: { type: "boolean" },
        pickupAt: { type: "string", description: "ISO time from get_pickup_slots (Lalamove only)" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              productId: { type: "string" },
              quantity: { type: "integer" },
              variations: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["productId", "quantity", "variations"],
          },
        },
      },
      required: [
        "customerConfirmed",
        "name",
        "phone",
        "paymentMethod",
        "deliveryMethod",
        "items",
      ],
    },
  },
  {
    name: "handoff_to_human",
    description:
      "Pause the bot for this conversation and alert the team. Use for complaints, refunds, custom or bulk orders, requests for a person, failed quotes, over-limit orders, or anything unclear.",
    input_schema: {
      type: "object",
      properties: { reason: { type: "string" } },
      required: ["reason"],
    },
  },
]