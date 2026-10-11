import { connection } from "next/server"
import { prisma } from "@/lib/prisma"
import { getBookingSlots } from "@/lib/schedule"

export async function getNewOrderData() {
  await connection()
  const now = new Date(Date.now())

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, price: true, weightGrams: true, variations: true },
  })

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price ? p.price.toString() : null,
      weightGrams: p.weightGrams,
      variations: Array.isArray(p.variations)
        ? (p.variations as { type: string; options: string[] }[])
        : [],
    })),
    slots: getBookingSlots(now).map((s) => ({
      value: s.startsAt.toISOString(),
      label: s.label,
    })),
  }
}