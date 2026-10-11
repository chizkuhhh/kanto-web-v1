import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProductForm from "@/components/admin/productForm"
import StockForm from "@/components/admin/stockForm"
import { saveProductAction, saveStockAction } from "../actions"

export const dynamic = "force-dynamic"

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; stock?: string }>
}) {
  const { id } = await params
  const { saved, stock } = await searchParams

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  const variants = await prisma.variant.findMany({
    where: { productId: id },
    orderBy: { optionsKey: "asc" },
    select: { id: true, options: true, stock: true },
  })

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <Link href="/admin/products" className="self-start text-sm text-mine-shaft-600 hover:text-mine-shaft-900">
          ← All products
        </Link>

        {saved === "1" && (
          <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Product saved.
          </p>
        )}
        {stock === "saved" && (
          <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Stock saved.
          </p>
        )}

        <h1 className="text-2xl font-bold">Edit product</h1>
        <ProductForm product={product} action={saveProductAction.bind(null, product.id)} />

        <StockForm variants={variants} action={saveStockAction.bind(null, product.id)} />
      </div>
    </div>
  )
}