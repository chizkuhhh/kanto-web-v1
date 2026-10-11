import Link from "next/link"
import ProductForm from "@/components/admin/productForm"
import { saveProductAction } from "../actions"

export const dynamic = "force-dynamic"

export default function NewProductPage() {
  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <Link href="/admin/products" className="self-start text-sm text-mine-shaft-600 hover:text-mine-shaft-900">
          ← All products
        </Link>
        <h1 className="text-2xl font-bold">New product</h1>
        <ProductForm product={null} action={saveProductAction.bind(null, null)} />
      </div>
    </div>
  )
}