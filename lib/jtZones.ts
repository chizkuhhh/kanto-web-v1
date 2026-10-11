import { connection } from "next/server"
import { prisma } from "@/lib/prisma"

const STALE_AFTER_MS = 90 * 24 * 3600_000

// Loads zones for the admin page and marks which ones need rechecking.
// The clock is read here, not in the component.
export async function getJtZonesForAdmin() {
  await connection()
  const now = Date.now()

  const zones = await prisma.jtZone.findMany({
    orderBy: { name: "asc" },
    include: { rates: { orderBy: { maxWeightGrams: "asc" } } },
  })

  return zones.map((z) => ({
    ...z,
    stale: !z.lastCheckedAt || now - z.lastCheckedAt.getTime() > STALE_AFTER_MS,
  }))
}