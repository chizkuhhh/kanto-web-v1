import { prisma } from "@/lib/prisma"
import { getBookingSlots } from "@/lib/schedule"
import CheckoutForm from "@/components/checkout/checkoutForm"

// Pickup slots change over time, so this page is never cached
export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const products = await prisma.product.findMany({
    where: { price: { not: null }, weightGrams: { not: null } },
    select: { id: true, name: true, price: true, weightGrams: true, variations: true },
  })

  const productData = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price!.toString(),
    weightGrams: p.weightGrams!,
    variations: (Array.isArray(p.variations) ? p.variations : []) as { type: string; options: string[] }[],
  }))

  const slots = getBookingSlots().map((s) => ({ value: s.startsAt.toISOString(), label: s.label }))

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <CheckoutForm products={productData} slots={slots} />
      </div>
    </div>
  )
}