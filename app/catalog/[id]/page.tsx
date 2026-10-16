import BackButton from "@/components/backButton"
import Gallery from "@/components/gallery"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { prisma } from "@/lib/prisma"
import { getProduct } from "@/lib/products"
import { notFound } from "next/navigation"
import AddToCart from "@/components/addToCart"

const categoryLabels: Record<string, string> = {
    PADDLE: "Paddles",
    ACCESSORY: "Accessories",
    ACTIVEWEAR: "Activewear",
}

export async function generateStaticParams() {
    const products = await prisma.product.findMany({ select: { id: true } })
    return products.map((p) => ({ id: p.id }))
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const product = await getProduct(id)

    if (!product)
        notFound()

    return (
        <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
            <div className="w-full max-w-2xl">
                <div className="flex mb-8 w-full justify-between">
                    <BackButton />

                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/catalog">Products</BreadcrumbLink>
                            </BreadcrumbItem>

                            <BreadcrumbSeparator />

                            <BreadcrumbItem>
                                <BreadcrumbLink href={`/catalog?category=${product.category}`}>{categoryLabels[product.category]}</BreadcrumbLink>
                            </BreadcrumbItem>

                            <BreadcrumbSeparator />

                            <BreadcrumbItem>
                                <BreadcrumbPage className="line-clamp-1 max-w-18 md:max-w-24">{product.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <Gallery images={product.images} name={product.name}/>

                <h1 className="text-2xl font-bold mt-6 text-mine-shaft-900">{product.name}</h1>
                {product.price && (
                    <p className="text-lg font-semibold text-mine-shaft-700 mt-1">
                        ₱{product.price.toString()}
                    </p>
                )}

                <div
                    className="text-mine-shaft-600 mt-3"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                />
                
                <div className="flex flex-col gap-3 mt-6 items-center">
                    {product.price && (
                        <AddToCart
                            productId={product.id}
                            variations={(Array.isArray(product.variations) ? product.variations : []) as { type: string; options: string[] }[]}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}