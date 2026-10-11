import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProductForm from "@/components/admin/productForm"
import { saveProductAction } from "../actions"

export const dynamic = "force-dynamic"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Edit product</h1>
        <ProductForm product={product} action={saveProductAction.bind(null, product.id)} />
      </div>
    </div>
  )
}