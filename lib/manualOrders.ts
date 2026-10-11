import { Prisma } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getJtFee } from "@/lib/jt"
import { isValidPickupTime } from "@/lib/schedule"
import { PAYMENT_METHODS } from "@/lib/orderLabels"

export const keyFor = (options: Record<string, string>) =>
  Object.keys(options).sort().map((k) => `${k}=${options[k]}`).join("|")

const COD = "Cash on delivery"

const JT_REASON: Record<string, string> = {
  invalid_weight: "A product in this order is missing its weight. Set it on the product page first.",
  unknown_province: "J&T can't quote this province or city. Check the spelling, or switch to Lalamove.",
  over_max_weight: "This order is over J&T's 5 kg limit.",
}

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  variations: z.record(z.string(), z.string()),
})

const inputSchema = z.object({
  channel: z.enum(["WEB", "MESSENGER", "INSTAGRAM", "MANUAL"]),
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
  items: z.array(itemSchema).min(1).max(20),
})

// 09171234567, 639171234567, or +63 917 123 4567 all become 09171234567
export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, "")
  if (digits.startsWith("63") && digits.length === 12) digits = "0" + digits.slice(2)
  return digits
}

const isPhMobile = (phone: string) => /^09\d{9}$/.test(phone)

// Used by the form to fill in a returning customer's details
export async function lookupCustomerByPhone(raw: string) {
  const phone = normalizePhone(raw)
  if (!isPhMobile(phone)) return null

  const customer = await prisma.customer.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { address: true, city: true, province: true, postalCode: true },
      },
    },
  })
  if (!customer) return null

  const last = customer.orders[0]
  return {
    name: customer.name,
    address: last?.address ?? "",
    city: last?.city ?? "",
    province: last?.province ?? "",
    postalCode: last?.postalCode ?? "",
  }
}

export async function createManualOrder(raw: unknown) {
  const input = inputSchema.parse(raw)
  const phone = normalizePhone(input.phone)
  if (!isPhMobile(phone)) throw new Error("Enter a valid PH mobile number, like 09171234567")

  // Lalamove: the pickup time must still be an open slot
  let pickupAt: Date | null = null
  if (input.deliveryMethod === "LALAMOVE") {
    if (!input.pickupAt) throw new Error("Choose a pickup time for Lalamove orders")
    pickupAt = new Date(input.pickupAt)
    if (!isValidPickupTime(pickupAt))
      throw new Error("That pickup time is no longer available. Choose another.")
  }

  // Prices come from the database, never from the form
  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(input.items.map((i) => i.productId))] } },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  let productTotal = new Prisma.Decimal(0)
  let totalWeight = 0

  const lines = input.items.map((item) => {
    const p = byId.get(item.productId)
    if (!p) throw new Error("One of the products no longer exists")
    if (!p.price) throw new Error(`${p.name} has no price set`)
    if (!p.weightGrams) throw new Error(`${p.name} has no weight set`)

    const variations = Array.isArray(p.variations)
      ? (p.variations as { type: string; options: string[] }[])
      : []

    // Every variation type must be chosen, using one of its options
    for (const v of variations) {
      const choice = item.variations[v.type]
      if (!choice || !v.options.includes(choice))
        throw new Error(`Choose a ${v.type} for ${p.name}`)
    }
    // Reject choices for variation types the product doesn't have
    for (const key of Object.keys(item.variations)) {
      if (!variations.some((v) => v.type === key))
        throw new Error(`${p.name} has no ${key} option`)
    }

    productTotal = productTotal.add(p.price.mul(item.quantity))
    totalWeight += p.weightGrams * item.quantity

    return {
      productId: p.id,
      productName: p.name,
      unitPrice: p.price,
      quantity: item.quantity,
      selectedVariations: item.variations,
    }
  })

  // J&T: quote shipping, and COD fee only when the customer pays cash on delivery
  let shippingFee = new Prisma.Decimal(0)
  let codFee: Prisma.Decimal | null = null

  if (input.deliveryMethod === "JNT") {
    const isCod = input.paymentMethod === COD
    const quote = await getJtFee({
      province: input.province,
      city: input.city,
      weightGrams: totalWeight,
      declaredAmount: isCod ? productTotal : undefined,
    })
    if (!quote.ok) throw new Error(JT_REASON[quote.reason] ?? "J&T can't quote this order.")
    shippingFee = quote.shippingFee
    codFee = quote.codFee
  }

    return prisma.$transaction(async (tx) => {
    // Stock: check and decrement each variant. Any shortfall rolls back the whole order.
    const variantIds: string[] = []
    for (const line of lines) {
      const variant = await tx.variant.findUnique({
        where: {
          productId_optionsKey: {
            productId: line.productId,
            optionsKey: keyFor(line.selectedVariations as Record<string, string>),
          },
        },
      })
      if (!variant || !variant.active)
        throw new Error(`${line.productName} is not available in these options`)

      const { count } = await tx.variant.updateMany({
        where: { id: variant.id, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      })
      if (count !== 1) throw new Error(`Not enough stock for ${line.productName}`)
      variantIds.push(variant.id)
    }

    const existing = await tx.customer.findFirst({
      where: { phone },
      orderBy: { createdAt: "desc" },
    })
    const customer = existing
      ? await tx.customer.update({ where: { id: existing.id }, data: { name: input.name } })
      : await tx.customer.create({ data: { name: input.name, phone } })

    return tx.order.create({
      data: {
        channel: input.channel,
        deliveryMethod: input.deliveryMethod,
        status: "PENDING",
        customerId: customer.id,
        recipientName: input.name,
        phone,
        address: input.address,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode || null,
        paymentMethod: input.paymentMethod,
        productTotal,
        shippingFee,
        codFee,
        pickupAt,
        notes: input.notes || null,
        items: {
          create: lines.map((line, i) => ({ ...line, variantId: variantIds[i] })),
        },
        events: {
          create: [{ fromStatus: null, toStatus: "PENDING", note: "Created manually" }],
        },
      },
      select: { id: true, orderNumber: true },
    })
  })
}