"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { addToCart, optionsKey } from "@/lib/cart"
import { getAvailableOptionsAction } from "@/app/catalog/[id]/actions"

type Variation = { type: string; options: string[] }
type Stock = { key: string; stock: number }

const label = "text-xs font-semibold uppercase tracking-wide text-mine-shaft-500"
const input = "w-full rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm"

export default function AddToCart({ productId, variations }: { productId: string; variations: Variation[] }) {
  // null while checking
  const [available, setAvailable] = useState<Stock[] | null>(null)
  const [stockError, setStockError] = useState(false)
  const [choice, setChoice] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let active = true
    getAvailableOptionsAction(productId)
      .then((rows) => {
        if (active) setAvailable(rows)
      })
      .catch(() => {
        if (active) setStockError(true)
      })
    return () => {
      active = false
    }
  }, [productId])

  const allChosen = variations.every((v) => choice[v.type])
  const chosenStock =
    available !== null && allChosen ? (available.find((s) => s.key === optionsKey(choice))?.stock ?? 0) : 0
  const inStock = chosenStock > 0
  const outOfStock = available !== null && available.length === 0

  // Quantity can't go past what's in stock for the chosen option
  const maxQty = allChosen ? Math.max(1, Math.min(50, chosenStock)) : 50
  const qty = Math.min(quantity, maxQty)

  // Only offer options that appear in at least one in-stock combination
  const optionsFor = (v: Variation) =>
    available
      ? v.options.filter((o) => available.some((s) => s.key.split("|").includes(`${v.type}=${o}`)))
      : []

  const status =
    available === null
      ? { text: "Checking stock…", tone: "text-mine-shaft-500" }
      : !allChosen
        ? { text: "Choose options to see stock", tone: "text-mine-shaft-500" }
        : inStock
          ? { text: `In stock (${chosenStock} left)`, tone: "text-green-700" }
          : { text: "Out of stock in this option", tone: "text-red-700" }

  if (stockError) return <p className="text-sm text-mine-shaft-600">Couldn&apos;t check stock. Please refresh the page.</p>
  if (outOfStock) return <p className="text-sm font-semibold text-red-700">Out of stock</p>

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <p className={`text-sm font-semibold ${status.tone}`}>{status.text}</p>

      {variations.map((v) => (
        <label key={v.type} className="flex flex-col gap-1">
          <span className={label}>{v.type}</span>
          <select
            className={input}
            disabled={available === null}
            value={choice[v.type] ?? ""}
            onChange={(e) => {
              setChoice((c) => ({ ...c, [v.type]: e.target.value }))
              setAdded(false)
            }}
          >
            <option value="">Choose</option>
            {optionsFor(v).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      ))}

      <label className="flex flex-col gap-1">
        <span className={label}>Quantity</span>
        <input
          type="number"
          min={1}
          max={maxQty}
          className={input}
          value={qty}
          onChange={(e) => {
            setQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))
            setAdded(false)
          }}
        />
      </label>

      <button
        type="button"
        disabled={!inStock}
        onClick={() => {
          addToCart({ productId, quantity: qty, variations: choice })
          setAdded(true)
        }}
        className="h-12 rounded-full bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900 disabled:opacity-50"
      >
        Add to cart
      </button>

      {added && (
        <p className="text-sm">
          Added to cart.{" "}
          <Link href="/checkout" className="font-semibold underline underline-offset-2">
            Go to checkout
          </Link>
        </p>
      )}
    </div>
  )
}