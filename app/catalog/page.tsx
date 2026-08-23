import CategoryTabs from "@/components/categoryTabs"
import ProductCard from "@/components/productCard"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Category } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import BackButton from "@/components/backButton"
import Pagination from "@/components/pagination"
import SortToggle from "@/components/sortToggle"

const categoryLabels: Record<string, string> = {
    PADDLE: "Paddles",
    ACCESSORY: "Accessories",
    ACTIVEWEAR: "Activewear",
}

const PAGE_SIZE = 12

function getOrderBy(sort?: string) {
    switch (sort) {
        case "oldest": return { createdAt: "asc" as const };
        case "price-asc": return { price: "asc" as const };
        case "price-desc": return { price: "desc" as const };
        case "name-asc": return { name: "asc" as const };
        default: return { createdAt: "desc" as const };
    }
}

export default async function CatalogPage({
    searchParams,
}: {
    searchParams: Promise<{category?: string; sort?: string; page?: string }>
}) {
    const { category, sort, page } = await searchParams
    const currentPage = Math.max(1, Number(page) || 1)

    let products, totalCount;

    try {
        const where = category ? { category: category as Category } : undefined;
        [products, totalCount] = await Promise.all([
        prisma.product.findMany({
            where,
            orderBy: getOrderBy(sort),
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.product.count({ where }),
        ]);
    } catch (err) {
        console.error("CATALOG PRISMA ERROR:", err);
        throw err;
    }

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
            <div className="flex mb-8 w-full justify-between">
                <BackButton />

                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/catalog">Products</BreadcrumbLink>
                        </BreadcrumbItem>

                        <BreadcrumbSeparator />

                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                {category ? categoryLabels[category] : "All"}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="w-full max-w-5xl flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Products</h1>
                <Suspense fallback={<div className="w-32 h-9" />}>
                    <SortToggle />
                </Suspense>
            </div>
            
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
            
            <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
    )
}