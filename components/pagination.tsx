"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";

export default function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number; }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    if (totalPages <= 1)
        return null

    function goToPage(page: number) {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", String(page))
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    className="rounded-full h-9 w-9 p-0"
                    onClick={() => goToPage(p)}
                >
                    {p}
                </Button>
            ))}
        </div>
    )
}