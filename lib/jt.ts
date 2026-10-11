import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { normalizePlace } from "@/lib/jtPlaces"

export const JT_MAX_WEIGHT_GRAMS = 5000
const COD_RATE = new Prisma.Decimal("0.0275") // 2.75% of declared amount
const VAT_RATE = new Prisma.Decimal("0.12")   // 12% VAT on the COD fee

export function computeCodFee(declared: Prisma.Decimal) {
  const fee = declared.mul(COD_RATE).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  const vat = fee.mul(VAT_RATE).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  return { fee, vat, total: fee.add(vat) }
}

export type JtQuote =
  | { ok: true; zone: string; shippingFee: Prisma.Decimal; codFee: Prisma.Decimal | null }
  | { ok: false; reason: "invalid_weight" | "unknown_province" | "over_max_weight" }

// A place matches a zone if it equals any name in that zone's list.
// Matching zero zones or more than one returns null, so the order is handed off.
export function matchZone<T extends { provinces: string[] }>(zones: T[], places: (string | undefined)[]) {
  const wanted = new Set(places.filter((p): p is string => !!p).map(normalizePlace))
  const hits = zones.filter((z) => z.provinces.some((name) => wanted.has(normalizePlace(name))))
  return hits.length === 1 ? hits[0] : null
}

export async function getJtFee(input: {
  province: string
  city?: string
  weightGrams: number
  // COD only: the product total, not shipping
  declaredAmount?: Prisma.Decimal
}): Promise<JtQuote> {
  if (!Number.isInteger(input.weightGrams) || input.weightGrams <= 0)
    return { ok: false, reason: "invalid_weight" }

  if (input.weightGrams > JT_MAX_WEIGHT_GRAMS)
    return { ok: false, reason: "over_max_weight" }

  const zones = await prisma.jtZone.findMany({
    include: { rates: { orderBy: { maxWeightGrams: "asc" } } },
  })

  const zone = matchZone(zones, [input.province, input.city])
  if (!zone) return { ok: false, reason: "unknown_province" }

  // Rounds up to the next bracket: 2 kg uses the 3 kg price
  const rate = zone.rates.find((r) => input.weightGrams <= r.maxWeightGrams)
  if (!rate) return { ok: false, reason: "over_max_weight" }

  return {
    ok: true,
    zone: zone.name,
    shippingFee: rate.price,
    codFee: input.declaredAmount ? computeCodFee(input.declaredAmount).total : null,
  }
}