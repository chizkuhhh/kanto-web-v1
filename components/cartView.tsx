"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import { getCartServerSnapshot, getCartSnapshot, parseCart, subscribeCart, writeCart } from "@/lib/cart"
import { formatPeso } from "@/lib/format"

type Product = { id: string; name: string; price: string }

const card = "flex flex-col gap-4 rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5"
const button = "rounded-full px-4 h-10 text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900"

export default function CartView({ products }: { products: Product[] }) {
  const raw = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot)
  const cart = useMemo(() => parseCart(raw), [raw])
  const productById = new Map(products.map((p) => [p.id, p]))

  // Only lines whose product still exists. Checkout uses the same rule.
  const lines = cart.flatMap((item, index) => {
    const product = productById.get(item.productId)
    return product ? [{ index, item, product }] : []
  })
  const subtotal = lines.reduce((sum, { item, product }) => sum + Number(product.price) * item.quantity, 0)

  function changeQuantity(index: number, quantity: number) {
    const next = cart
      .map((item, i) => (i === index ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0)
    writeCart(next)
  }

  if (lines.length === 0)
    return (
      <div className={card}>
        <p className="text-sm">Your cart is empty.</p>
        <Link href="/catalog" className="text-sm font-semibold underline underline-offset-2">
          Browse products
        </Link>
      </div>
    )

  return (
    <div className="flex flex-col gap-6">
      <div className={card}>
        {lines.map(({ index, item, product }) => (
          <div key={index} className="flex justify-between gap-4 border-b border-black-haze-200 pb-3 text-sm last:border-0">
            <div>
              <p className="font-semibold">{product.name}</p>
              {Object.keys(item.variations).length > 0 && (
                <p className="text-mine-shaft-600">
                  {Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </p>
              )}
              <p className="text-mine-shaft-500">{formatPeso(Number(product.price))}</p>
              <button
                type="button"
                onClick={() => changeQuantity(index, 0)}
                className="mt-1 text-xs text-red-700 hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeQuantity(index, item.quantity - 1)}
                className="h-8 w-8 rounded-full border border-black-haze-300"
              >
                −
              </button>
              <span className="w-6 text-center">{item.quantity}</span>
              <button
                type="button"
                onClick={() => changeQuantity(index, item.quantity + 1)}
                disabled={item.quantity >= 50}
                className="h-8 w-8 rounded-full border border-black-haze-300 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={card}>
        <div className="flex justify-between text-sm">
          <span>Products</span>
          <span>{formatPeso(subtotal)}</span>
        </div>
        <p className="text-xs text-mine-shaft-500">Shipping and any COD fee are calculated at checkout.</p>
        <Link href="/checkout" className={`${button} flex items-center justify-center`}>
          Go to checkout
        </Link>
      </div>
    </div>
  )
}