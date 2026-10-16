import { z } from "zod"
import { Category } from "@prisma/client"

const variationsSchema = z.array(
  z.object({
    type: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(1),
  }),
)

export function parseProductForm(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim()

  const name = get("name")
  if (!name) throw new Error("Name is required")

  const category = z.nativeEnum(Category).parse(get("category"))

  const price = get("price")
  if (price && !/^\d+(\.\d{1,2})?$/.test(price))
    throw new Error("Price must be a number with up to 2 decimals")

  const weight = get("weightGrams")
  if (weight && !/^\d+$/.test(weight) || Number(weight) <= 0 && weight)
    throw new Error("Weight must be a positive whole number of grams")

  // One image URL per line. Blank lines are dropped, so no empty strings reach the database.
  const images = get("images")
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean)
  for (const url of images) {
    if (!z.string().url().startsWith("https://").safeParse(url).success)
      throw new Error(`Image must be a full https:// URL: ${url}`)
  }

  let variationsRaw: unknown
  try {
    variationsRaw = JSON.parse(get("variations") || "[]")
  } catch {
    throw new Error("Variations must be valid JSON")
  }
  const variations = variationsSchema.parse(variationsRaw)

  return {
    name,
    description: get("description"),
    category,
    price: price || null,
    weightGrams: weight ? Number(weight) : null,
    images,
    variations,
  }
}