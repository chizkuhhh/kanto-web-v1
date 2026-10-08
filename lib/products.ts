import { unstable_cache } from "next/cache"
import type { Category, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

// Cached product list. Cache entries are keyed by the arguments, so each
// category/sort/page combination gets its own entry.
// Busted immediately when you call revalidateTag("products") after editing,
// and refreshed at most every 5 minutes otherwise.
export const getProductPage = unstable_cache(
    async (
        where: { category: Category } | undefined,
        orderBy: Prisma.ProductOrderByWithRelationInput,
        skip: number,
        take: number,
    ) => {
        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({ where, orderBy, skip, take }),
            prisma.product.count({ where }),
        ])
        return { products, totalCount }
    },
    ["product-page"],
    { revalidate: 300, tags: ["products"] },
)

// Cached single product. Tagged both globally and per product so edits can
// bust just that one page.
export function getProduct(id: string) {
    return unstable_cache(
        () => prisma.product.findUnique({ where: { id } }),
        ["product", id],
        { revalidate: 300, tags: ["products", `product:${id}`] },
    )()
}