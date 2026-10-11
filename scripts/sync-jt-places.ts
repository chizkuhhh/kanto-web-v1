import { PrismaClient } from "@prisma/client"
import { JT_PLACES, normalizePlace } from "../lib/jtPlaces"

const DEV_HOST = "ep-nameless-heart-az7ty9p1"
if (!(process.env.DATABASE_URL ?? "").includes(DEV_HOST))
  throw new Error("Refusing to run: DATABASE_URL is not the dev-phase2 branch.")

// A place in two zones would make lookups ambiguous, so stop before writing anything
const owner = new Map<string, string>()
for (const [zone, places] of Object.entries(JT_PLACES)) {
  for (const place of places) {
    const key = normalizePlace(place)
    const existing = owner.get(key)
    if (existing && existing !== zone)
      throw new Error(`"${place}" is listed in both "${existing}" and "${zone}"`)
    owner.set(key, zone)
  }
}

const prisma = new PrismaClient()

async function main() {
  for (const [name, places] of Object.entries(JT_PLACES)) {
    const zone = await prisma.jtZone.findFirst({ where: { name } })
    if (!zone) {
      console.warn(`No zone named "${name}" in the database. Skipped.`)
      continue
    }
    await prisma.jtZone.update({ where: { id: zone.id }, data: { provinces: places } })
    console.log(`Updated ${name}: ${places.length} places`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())