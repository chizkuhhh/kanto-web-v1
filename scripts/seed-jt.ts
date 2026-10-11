import { PrismaClient } from "@prisma/client"

const DEV_HOST = "ep-nameless-heart-az7ty9p1"
if (!(process.env.DATABASE_URL ?? "").includes(DEV_HOST))
  throw new Error("Refusing to seed: DATABASE_URL is not the dev-phase2 branch.")

const prisma = new PrismaClient()
const WEIGHTS = [500, 1000, 3000, 5000] // 0.5, 1, 3, 5 kg
const CHECKED = new Date("2026-10-10")

const ZONES = [
  { name: "Metro Manila", provinces: ["Metro Manila"], prices: ["135.00", "165.00", "205.00", "270.00"] },
  { name: "Nearby Luzon", provinces: ["Cavite", "Laguna", "Bulacan", "Rizal", "Batangas", "Pampanga", "Bataan"], prices: ["145.00", "215.00", "240.00", "370.00"] },
  { name: "Far Luzon", provinces: ["Ilocos Norte", "Cagayan", "Isabela", "Benguet", "Albay", "Sorsogon", "Palawan"], prices: ["145.00", "215.00", "240.00", "370.00"] },
  { name: "Visayas", provinces: ["Cebu", "Iloilo", "Negros Occidental", "Bohol", "Leyte", "Samar"], prices: ["150.00", "230.00", "250.00", "420.00"] },
  { name: "Mindanao", provinces: ["Davao", "Zamboanga", "Cagayan de Oro", "General Santos"], prices: ["155.00", "245.00", "270.00", "420.00"] },
  { name: "Remote islands", provinces: ["Batanes", "Sulu", "Tawi-Tawi", "Camiguin", "Siargao"], prices: ["165.00", "255.00", "280.00", "430.00"] },
]

async function main() {
  const existing = await prisma.jtZone.count()
  if (existing > 0) {
    console.log(`Skipped: ${existing} zone(s) already exist.`)
    return
  }

  for (const z of ZONES) {
    await prisma.jtZone.create({
      data: {
        name: z.name,
        provinces: z.provinces,
        lastCheckedAt: CHECKED,
        rates: {
          create: WEIGHTS.map((w, i) => ({ maxWeightGrams: w, price: z.prices[i] })),
        },
      },
    })
  }
  console.log(`Seeded ${ZONES.length} J&T zones.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())