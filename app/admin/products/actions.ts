"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { parseProductForm } from "@/lib/productForm"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { syncVariants } from "@/lib/variantSync"

async function requireAdmin() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
}

// productId is null when creating a new product
export async function saveProductAction(productId: string | null, formData: FormData) {
  await requireAdmin()
  const data = parseProductForm(formData)

  const id = await prisma.$transaction(async (tx) => {
    let id = productId
    if (id) {
      await tx.product.update({ where: { id }, data })
    } else {
      const created = await tx.product.create({ data })
      id = created.id
    }
    await syncVariants(tx, id, data.variations)
    return id
  })

  revalidateTag("products", "max")
  revalidatePath("/admin/products")
  redirect(`/admin/products/${id}?saved=1`)
}

export async function saveStockAction(productId: string, formData: FormData) {
  await requireAdmin()

  const variants = await prisma.variant.findMany({
    where: { productId },
    select: { id: true },
  })

  const changes = variants.flatMap((v) => {
    const raw = String(formData.get(`stock_${v.id}`) ?? "").trim()
    const prev = Number(formData.get(`prev_${v.id}`))
    if (!/^\d{1,6}$/.test(raw))
      throw new Error("Stock must be a whole number from 0 to 999999")
    const next = Number(raw)
    return next === prev ? [] : [{ id: v.id, prev, next }]
  })

  await prisma.$transaction(async (tx) => {
    for (const c of changes) {
      // Only updates if the stock still matches what the admin loaded.
      // If an order changed it in the meantime, nothing is written.
      const { count } = await tx.variant.updateMany({
        where: { id: c.id, productId, stock: c.prev },
        data: { stock: c.next },
      })
      if (count !== 1)
        throw new Error("Stock changed while you were editing. Reload the page and try again.")
    }
  })

  redirect(`/admin/products/${productId}?stock=saved`)
}