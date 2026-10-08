import { Product as PrismaProduct } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

export default function ProductCard({ product, priority = false }: { product: PrismaProduct; priority?: boolean }) {
    return (
        <Link
            href={`/catalog/${product.id}`}
            className="flex flex-col h-full rounded-2xl overflow-hidden bg-black-haze-50 border border-black-haze-200 hover:shadow-md transition-shadow"
        >
            <div className="relative aspect-4/5 shrink-0">
                {product.images[0] ? (
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(min-width: 768px) 33vw, 50vw"
                        priority={priority}
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-black-haze-200" />
                )}
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-mine-shaft-900">{product.name}</h3>
                <div 
                    className="text-sm text-mine-shaft-600 line-clamp-2"
                    dangerouslySetInnerHTML={{__html: product.description}}
                />
                {product.price && (
                    <p className="mt-auto pt-2 font-semibold text-mine-shaft-800">₱{product.price.toString()}</p>
                )}
            </div>
        </Link>
    )
}