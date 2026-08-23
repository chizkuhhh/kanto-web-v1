"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
    const router = useRouter()

    return (
        <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-mine-shaft-600 hover:text-mine-shaft-900 transition-colors"
        >
            <ArrowLeft size={16} />
            Back
        </button>
    )
}