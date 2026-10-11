import { getNewOrderData } from "@/lib/adminData"
import NewOrderForm from "@/components/admin/newOrderForm"

export const dynamic = "force-dynamic"

export default async function NewOrderPage() {
  const data = await getNewOrderData()

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <h1 className="text-2xl font-bold">New order</h1>
        <NewOrderForm products={data.products} slots={data.slots} />
      </div>
    </div>
  )
}