import { Product as PrismaProduct } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

export default function ProductCard({ product }: { product: PrismaProduct }) {
    return (
        <Link
            href={`/catalog/${product.id}`}
            className="block rounded-2xl overflow-hidden bg-black-haze-50 border border-black-haze-200 hover:shadow-md transition-shadow"
        >
            <div className="relative aspect-square">
                <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                />
            </div>

            <div className="p-4 flex flex-col">
                <h3 className="font-bold text-mine-shaft-900">{product.name}</h3>
                <div 
                    className="text-sm text-mine-shaft-600 line-clamp-2"
                    dangerouslySetInnerHTML={{__html: product.description}}
                />
                {product.price && (
                    <p className="mt-1 font-semibold text-mine-shaft-800 self-end">₱{product.price.toString()}</p>
                )}
            </div>
        </Link>
    )
}