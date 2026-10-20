"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { clearBibleCache } from "@/lib/bible"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
}

export async function saveBibleAction(formData: FormData) {
  await requireAdmin()
  const content = String(formData.get("content") ?? "").trim()
  if (content.length < 50) throw new Error("The bible is too short to save")
  if (content.length > 40000) throw new Error("The bible is too long (over 40,000 characters)")

  await prisma.agentBibleVersion.create({ data: { content } })
  clearBibleCache()
  revalidatePath("/admin/bible")
}

// Restoring creates a new version with the old content, so history is never lost
export async function restoreBibleAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id") ?? "")
  const old = await prisma.agentBibleVersion.findUniqueOrThrow({ where: { id } })

  await prisma.agentBibleVersion.create({ data: { content: old.content } })
  clearBibleCache()
  revalidatePath("/admin/bible")
}