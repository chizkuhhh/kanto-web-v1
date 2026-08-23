"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const categories = [
    { label: "All", value: null },
    { label: "Paddles", value: "PADDLE" },
    { label: "Accessories", value: "ACCESSORY" },
    { label: "Activewear", value: "ACTIVEWEAR" },
]

export default function CategoryTabs() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeCategory = searchParams.get("category")

    function handleClick (value: string | null) {
        const params = new URLSearchParams(searchParams.toString())

        if (value) {
            params.set("category", value)
        } else {
            params.delete("category")
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex gap-2 flex-wrap justify-center">
            {categories.map(({ label, value }) => (
                <button
                    key={label}
                    onClick={() => handleClick(value)}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm transition-colors",
                        activeCategory === value
                        ? "bg-mine-shaft-800 text-black-haze-100"
                        : "bg-black-haze-200 text-mine-shaft-700 hover:bg-black-haze-300"
                    )}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}