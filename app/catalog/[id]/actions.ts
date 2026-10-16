"use server"

import { prisma } from "@/lib/prisma"

// In-stock option combinations for one product, with their counts.
export async function getAvailableOptionsAction(
  productId: string,
): Promise<{ key: string; stock: number }[]> {
  const variants = await prisma.variant.findMany({
    where: { productId, active: true, stock: { gt: 0 } },
    select: { optionsKey: true, stock: true },
  })
  return variants.map((v) => ({ key: v.optionsKey, stock: v.stock }))
}