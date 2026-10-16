"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { getCartServerSnapshot, getCartSnapshot, parseCart, subscribeCart } from "@/lib/cart";

// Total quantity in the cart. Returns a number, so React only re-renders when it changes.
const getCartCount = () => parseCart(getCartSnapshot()).reduce((n, item) => n + item.quantity, 0);
const getServerCartCount = () => 0;

export default function Header() {
    const pathname = usePathname()
    const cartCount = useSyncExternalStore(subscribeCart, getCartCount, getServerCartCount)

    const navClass = (href: string) =>
        pathname === href
            ? "font-bold text-mine-shaft-900"
            : "text-mine-shaft-700 hover:text-mine-shaft-900 transition-colors"

    return (
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 py-4 md:px-8 md:py-6 bg-black-haze-100/80 backdrop-blur-sm text-md">
            <Link href="/catalog" className={navClass("/catalog")}>
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

            <div className="flex items-center gap-5">
                <Link href="/contact" className={navClass("/contact")}>
                    Contact Us
                </Link>
                <Link
                    href="/cart"
                    aria-label={`Cart, ${cartCount} items`}
                    className={`relative ${navClass("/cart")}`}
                >
                    <FiShoppingCart size={22} />
                    {cartCount > 0 && (
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-mine-shaft-800 px-1 text-xs text-black-haze-100">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    )
}