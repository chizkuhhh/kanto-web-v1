"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { normalizePlace } from "@/lib/jtPlaces"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
}

const PRICE = /^\d+(\.\d{1,2})?$/

export async function updateJtZoneAction(zoneId: string, formData: FormData) {
  await requireAdmin()

  const zone = await prisma.jtZone.findUniqueOrThrow({
    where: { id: zoneId },
    include: { rates: true },
  })

  // Places: one per line
  const provinces = String(formData.get("provinces") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  for (const p of provinces) {
    const key = normalizePlace(p)
    if (seen.has(key)) throw new Error(`"${p}" is listed twice in ${zone.name}`)
    seen.add(key)
  }

  // A place can only belong to one zone, or lookups become ambiguous
  const others = await prisma.jtZone.findMany({
    where: { id: { not: zoneId } },
    select: { name: true, provinces: true },
  })
  for (const other of others) {
    for (const p of other.provinces) {
      if (seen.has(normalizePlace(p)))
        throw new Error(`"${p}" is already in ${other.name}. Remove it there first.`)
    }
  }

  // Prices: one per weight bracket
  const rateUpdates = zone.rates.map((r) => {
    const raw = String(formData.get(`rate_${r.id}`) ?? "").trim()
    if (!PRICE.test(raw))
      throw new Error(`${zone.name}: the ${r.maxWeightGrams / 1000} kg price must be a number like 165.00`)
    return { id: r.id, price: new Prisma.Decimal(raw) }
  })

  const markChecked = formData.get("markChecked") === "on"

  await prisma.$transaction([
    prisma.jtZone.update({
      where: { id: zoneId },
      data: {
        provinces,
        ...(markChecked && { lastCheckedAt: new Date() }),
      },
    }),
    ...rateUpdates.map((u) =>
      prisma.jtRate.update({ where: { id: u.id }, data: { price: u.price } }),
    ),
  ])

  revalidatePath("/admin/jt-rates")
}