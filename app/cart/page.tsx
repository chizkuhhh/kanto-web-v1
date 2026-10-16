import { prisma } from "@/lib/prisma"
import CartView from "@/components/cartView"

export default async function CartPage() {
  const products = await prisma.product.findMany({
    where: { price: { not: null } },
    select: { id: true, name: true, price: true },
  })

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Your cart</h1>
        <CartView products={products.map((p) => ({ id: p.id, name: p.name, price: p.price!.toString() }))} />
      </div>
    </div>
  )
}