import { PrismaClient } from "@prisma/client"
import { JT_PLACES } from "../lib/jtPlaces"

const MAIN_HOST = "ep-young-pine-az6q0yg6"
if (!(process.env.DATABASE_URL ?? "").includes(MAIN_HOST))
  throw new Error("Refusing to run: DATABASE_URL is not the main branch.")

const WEIGHTS = [500, 1000, 3000, 5000]
const CHECKED = new Date("2026-10-10")

const PRICES: Record<string, string[]> = {
  "Metro Manila": ["135.00", "165.00", "205.00", "270.00"],
  "Nearby Luzon": ["145.00", "215.00", "240.00", "370.00"],
  "Far Luzon": ["145.00", "215.00", "240.00", "370.00"],
  "Visayas": ["150.00", "230.00", "250.00", "420.00"],
  "Mindanao": ["155.00", "245.00", "270.00", "420.00"],
  "Remote islands": ["165.00", "255.00", "280.00", "430.00"],
}

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.jtZone.count()
  if (existing > 0) {
    console.log(`Skipped: ${existing} zone(s) already exist on production.`)
    return
  }

  for (const [name, prices] of Object.entries(PRICES)) {
    const provinces = JT_PLACES[name]
    if (!provinces) throw new Error(`No place list for "${name}"`)

    await prisma.jtZone.create({
      data: {
        name,
        provinces,
        lastCheckedAt: CHECKED,
        rates: {
          create: WEIGHTS.map((w, i) => ({ maxWeightGrams: w, price: prices[i] })),
        },
      },
    })
  }
  console.log(`Created ${Object.keys(PRICES).length} J&T zones on production.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())