import CategoryTabs from "@/components/categoryTabs"
import ProductCard from "@/components/productCard"
import { Category } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { Suspense } from "react"

export default async function CatalogPage({
    searchParams,
}: {
    searchParams: Promise<{category?: string }>
}) {
    const { category } = await searchParams

    let products;
    try {
        products = await prisma.product.findMany({
            where: category ? { category: category as Category } : undefined,
            orderBy: { createdAt: "desc" },
        });
    } catch (err) {
        console.error("CATALOG PRISMA ERROR:", err);
        throw err;
    }

    return (
        <div className="flex flex-col items-center px-5 pt-24 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Products</h1>
            <Suspense fallback={<div className="h-10" />}>
                <CategoryTabs />
            </Suspense>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 w-full max-w-5xl">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
            {products.length === 0 && (
                <p className="mt-12 text-mine-shaft-500">No products in this category yet.</p>
            )}
        </div>
    )
}