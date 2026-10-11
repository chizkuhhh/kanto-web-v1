import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatPeso } from "@/lib/format"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  PADDLE: "Paddles",
  ACCESSORY: "Accessories",
  ACTIVEWEAR: "Activewear",
}

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      weightGrams: true,
      variations: true,
      images: true,
    },
  })

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <Link href="/admin/products/new" className="rounded-full px-4 h-10 inline-flex items-center text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900">
            New product
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="mt-12 text-center text-mine-shaft-500">No products yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black-haze-200 bg-black-haze-50">
            <table className="w-full text-sm">
              <thead className="bg-black-haze-100 text-left text-mine-shaft-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Weight</th>
                  <th className="px-4 py-3 font-semibold">Options</th>
                  <th className="px-4 py-3 font-semibold text-right">Images</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const variations = Array.isArray(p.variations)
                    ? (p.variations as { type: string; options: string[] }[])
                    : []
                  return (
                    <tr key={p.id} className="border-t border-black-haze-200 hover:bg-black-haze-100">
                      <td className="px-4 py-3 font-semibold">
                        <Link href={`/admin/products/${p.id}`} className="underline underline-offset-2">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{CATEGORY_LABELS[p.category]}</td>
                      <td className="px-4 py-3 text-right">{p.price ? formatPeso(Number(p.price)) : "—"}</td>
                      <td className="px-4 py-3 text-right">{p.weightGrams ? `${p.weightGrams} g` : "Not set"}</td>
                      <td className="px-4 py-3">
                        {variations.length
                          ? variations.map((v: { type: string }) => v.type).join(", ")
                          : "None"}
                      </td>
                      <td className="px-4 py-3 text-right">{p.images.length}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}