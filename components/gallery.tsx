"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
    const [activeImage, setActiveImage] = useState(images[0])

    return (
        <div>
            <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-black-haze-200">
                <Image src={activeImage} alt={name} fill priority className="object-cover" />
            </div>

            {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                    {images.map((img) => (
                        <button
                            key={img}
                            onClick={() => setActiveImage(img)}
                            className={cn(
                                "relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2",
                                activeImage === img ? "border-mine-shaft-800" : "border-transparent"
                            )}
                        >
                            <Image src={img} alt="" fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}