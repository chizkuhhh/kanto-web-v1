import Gallery from "@/components/gallery"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { SiShopee, SiTiktok } from "react-icons/si"

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const product = await prisma.product.findUnique({
        where: { id },
    })

    if (!product)
        notFound()

    return (
        <div className="flex flex-col items-center px-5 pt-24 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
            <div className="w-full max-w-2xl">
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
                    {product.shopeeUrl && (
                        <Button className="rounded-full h-12 bg-mine-shaft-800 hover:bg-mine-shaft-900 px-4">
                            <a href={product.shopeeUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2">
                                <SiShopee className="text-orange-500" />
                                <p>Shop on <span className="font-bold">Shopee</span></p>
                            </a>
                        </Button>
                    )}
                    {product.tiktokUrl && (
                        <Button variant="outline" className="rounded-full h-12 border-mine-shaft-800 bg-black-haze-100 px-4">
                            <a href={product.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2">
                                <SiTiktok />
                                <p>Shop on <span className="font-bold">Tiktok</span></p>
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}