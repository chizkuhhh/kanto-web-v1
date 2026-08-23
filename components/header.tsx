"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";


export default function Header() {
    const pathname = usePathname()

    return (
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 py-4 md:px-8 md:py-6 bg-black-haze-100/80 backdrop-blur-sm text-md">
            <Link
                href="/catalog"
                className={
                    pathname === "/catalog"
                        ? "font-bold text-mine-shaft-900"
                        : "text-mine-shaft-700 hover:text-mine-shaft-900 transition-colors"
                }
            >
                Products
            </Link>
            
            <Link href="/">
                <Image
                    src="/Emblem-Light.svg"
                    alt="Kanto Emblem"
                    width={60}
                    height={60}
                    unoptimized
                />
            </Link>

            <Link
                href="/contact"
                className={
                    pathname === "/contact"
                        ? "font-bold text-mine-shaft-900"
                        : "text-mine-shaft-700 hover:text-mine-shaft-900 transition-colors"
                }
            >
                Contact Us
            </Link>
        </header>
    )
}