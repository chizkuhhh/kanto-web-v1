import { Prisma } from "@prisma/client"
import { getJtFee } from "../lib/jt"

const cases: { province: string; city?: string; expect: string }[] = [
    { province: "Metro Manila", city: "Quezon City", expect: "Metro Manila" },
    { province: "Quezon City", city: "Quezon City", expect: "Metro Manila" },
    { province: "Quezon", expect: "Nearby Luzon" },
    { province: "Cavite", city: "Bacoor", expect: "Nearby Luzon" },
    { province: "Cebu", city: "Cebu City", expect: "Visayas" },
    { province: "Davao del Sur", city: "Davao City", expect: "Mindanao" },
    { province: "Batanes", city: "Basco", expect: "Remote islands" },
    { province: "Ilocos Norte", city: "Laoag", expect: "Far Luzon" },
    { province: "Marinduque", city: "Boac", expect: "Far Luzon" },
    { province: "Romblon", expect: "Remote islands" },
]

async function main() {
  let failed = 0
  for (const c of cases) {
    const quote = await getJtFee({
      province: c.province,
      city: c.city,
      weightGrams: 1000,
      declaredAmount: new Prisma.Decimal("1000"),
    })
    const got = quote.ok ? quote.zone : "unknown"
    const pass = got === c.expect
    if (!pass) failed++
    console.log(`${pass ? "PASS" : "FAIL"}  ${c.province} / ${c.city ?? "-"} -> ${got} (expected ${c.expect})`)
  }
  console.log(failed === 0 ? "\nAll cases passed." : `\n${failed} case(s) failed.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => process.exit(process.exitCode ?? 0))