"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
    {
        href: "/catalog",
        label: "Products"
    },
    {
        href: "/contact",
        label: "Contact Us"
    }
]

export default function Header() {
    const pathname = usePathname()

    return (
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 py-4 md:px-8 md:py-6 bg-black-haze-100/80 backdrop-blur-sm text-md">
            {navLinks.map(({ href, label }) => (
                <Link
                    key={href}
                    href={href}
                    className={
                        pathname === href
                            ? "font-bold text-mine-shaft-900"
                            : "text-mine-shaft-700 hover:text-mine-shaft-900 transition-colors"
                    }
                >
                    {label}
                </Link>
            ))}
        </header>
    )
}