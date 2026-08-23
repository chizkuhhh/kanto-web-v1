"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A–Z", value: "name-asc" },
]

export default function SortToggle() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeSort = searchParams.get("sort") || "newest"

    function handleChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set("sort", value)
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <select
            value={activeSort}
            onChange={(e) => handleChange(e.target.value)}
            className="text-sm border border-black-haze-300 rounded-full px-3 py-2 bg-black-haze-50 text-mine-shaft-700"
        >
            {sortOptions.map(({ label, value }) => (
                <option key={value} value={value}>{label}</option>
            ))}
        </select>
    )
}