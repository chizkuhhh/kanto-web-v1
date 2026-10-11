"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { parseProductForm } from "@/lib/productForm"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

async function requireAdmin() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
}

// productId is null when creating a new product
export async function saveProductAction(productId: string | null, formData: FormData) {
  await requireAdmin()
  const data = parseProductForm(formData)

  let id = productId
  if (id) {
    await prisma.product.update({ where: { id }, data })
  } else {
    const created = await prisma.product.create({ data })
    id = created.id
  }

  // Clears the cached catalog and product pages so edits show up right away
  revalidateTag("products", "max")
  revalidatePath("/admin/products")
  redirect(`/admin/products/${id}`)
}