import { Prisma } from "@prisma/client"
import { keyFor } from "@/lib/manualOrders"

type Variation = { type: string; options: string[] }

// Every combination of the product's options, as plain objects.
// A product with no variations gets one empty combination.
function combinations(variations: Variation[]): Record<string, string>[] {
  return variations.reduce<Record<string, string>[]>(
    (acc, v) =>
      acc.flatMap((combo) => v.options.map((opt) => ({ ...combo, [v.type]: opt }))),
    [{}],
  )
}

export async function syncVariants(
  tx: Prisma.TransactionClient,
  productId: string,
  variations: Variation[],
) {
  const wanted = combinations(variations)
  const wantedKeys = new Set(wanted.map(keyFor))

  const existing = await tx.variant.findMany({
    where: { productId },
    select: { id: true, optionsKey: true, active: true },
  })
  const existingKeys = new Set(existing.map((v) => v.optionsKey))

  // New combinations start at zero stock, so nothing sells until you count
  const toCreate = wanted.filter((c) => !existingKeys.has(keyFor(c)))
  if (toCreate.length > 0) {
    await tx.variant.createMany({
      data: toCreate.map((options) => ({
        productId,
        options,
        optionsKey: keyFor(options),
        stock: 0,
        active: true,
      })),
    })
  }

  // Deactivate rows whose combination is gone, and reactivate ones that came back
  for (const v of existing) {
    const shouldBeActive = wantedKeys.has(v.optionsKey)
    if (v.active !== shouldBeActive) {
      await tx.variant.update({ where: { id: v.id }, data: { active: shouldBeActive } })
    }
  }
}