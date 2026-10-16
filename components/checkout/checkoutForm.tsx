"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { placeWebOrderAction, quoteShippingAction, type QuoteResult, createProofUploadAction } from "@/app/checkout/actions"
import { PAYMENT_METHODS } from "@/lib/orderLabels"
import { LALAMOVE_DISCLAIMER } from "@/lib/agent/prompt"
import {
  getCartServerSnapshot,
  getCartSnapshot,
  parseCart,
  subscribeCart,
  writeCart,
} from "@/lib/cart"
import { formatPeso } from "@/lib/format"

type Product = {
  id: string
  name: string
  price: string
  weightGrams: number
  variations: { type: string; options: string[] }[]
}
type Slot = { value: string; label: string }

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (widgetId: string) => void
    }
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

const label = "text-xs font-semibold uppercase tracking-wide text-mine-shaft-500"
const input = "w-full rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm"
const card = "flex flex-col gap-4 rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5"
const button =
  "rounded-full px-4 h-10 text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900 disabled:opacity-50"

export default function CheckoutForm({ products, slots }: { products: Product[]; slots: Slot[] }) {
  const router = useRouter()
  const productById = new Map(products.map((p) => [p.id, p]))

  const cartRaw = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot)
  const cart = useMemo(() => parseCart(cartRaw), [cartRaw])
  const [form, setForm] = useState({
    deliveryMethod: "JNT" as "JNT" | "LALAMOVE",
    paymentMethod: PAYMENT_METHODS[0] as string,
    name: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    notes: "",
    pickupAt: "",
  })
  const [lalamoveAccepted, setLalamoveAccepted] = useState(false)
  const [quoteState, setQuoteState] = useState<{ key: string; result: QuoteResult } | null>(null)
  const [banner, setBanner] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [token, setToken] = useState("")
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [proof, setProof] = useState<{ key: string; name: string } | null>(null)
  const [proofBusy, setProofBusy] = useState(false)

  const isLalamove = form.deliveryMethod === "LALAMOVE"
  const needsProof = form.paymentMethod === "GCash" || form.paymentMethod === "Bank transfer"
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))

  // Cart lines whose product still exists. index is the position in the cart.
  const lines = cart.flatMap((item, index) => {
    const product = productById.get(item.productId)
    return product ? [{ index, item, product }] : []
  })
  const productTotal = lines.reduce((sum, { item, product }) => sum + Number(product.price) * item.quantity, 0)
  const cartKey = JSON.stringify(lines.map(({ item }) => [item.productId, item.quantity, item.variations]))

  const quoteKey = JSON.stringify([isLalamove, form.province, form.city, form.paymentMethod, cartKey])
  // A quote only applies to the inputs it was calculated for. Otherwise it's treated as none.
  const quote = quoteState && quoteState.key === quoteKey ? quoteState.result : null


  // Turnstile widget, rendered once
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    const render = () => {
      if (!window.turnstile || !widgetRef.current || widgetId.current) return
      widgetId.current = window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => setToken(t),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      })
    }
    if (window.turnstile) {
      render()
      return
    }
    const script = document.createElement("script")
    script.src = TURNSTILE_SRC
    script.async = true
    script.onload = render
    document.head.appendChild(script)
  }, [])

    // J&T quote, refreshed when the province, city, payment, or cart changes
  useEffect(() => {
    if (isLalamove || !form.province.trim() || lines.length === 0) return

    let active = true
    const timer = setTimeout(async () => {
      const result = await quoteShippingAction({
        province: form.province,
        city: form.city,
        paymentMethod: form.paymentMethod,
        items: lines.map(({ item }) => ({ productId: item.productId, quantity: item.quantity })),
      })
      if (active) setQuoteState({ key: quoteKey, result })
    }, 500)

    return () => {
      active = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey])

  function changeQuantity(index: number, quantity: number) {
    const next = cart
      .map((item, i) => (i === index ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0)
    writeCart(next)
  }

  const shipping = !isLalamove && quote?.ok ? Number(quote.shippingFee) : 0
  const codFee = !isLalamove && quote?.ok && quote.codFee ? Number(quote.codFee) : 0
  const total = productTotal + shipping + codFee

  const needsCheck = Boolean(TURNSTILE_SITE_KEY) && !token
  const canSubmit =
    !submitting &&
    lines.length > 0 &&
    !needsCheck &&
    (!isLalamove || (lalamoveAccepted && form.pickupAt !== ""))
    && (!needsProof || proof !== null)

  async function uploadProof(file: File) {
    setBanner("")
    if (file.size > 5 * 1024 * 1024) {
      setBanner("That image is over 5 MB. Please choose a smaller one.")
      return
    }
    setProofBusy(true)
    try {
      const res = await createProofUploadAction(file.type)
      if (!res.ok) {
        setBanner(res.error)
        return
      }
      const put = await fetch(res.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!put.ok) throw new Error("upload failed")
      setProof({ key: res.key, name: file.name })
    } catch {
      setBanner("Couldn't upload the image. Please try again.")
    } finally {
      setProofBusy(false)
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return
    setBanner("")
    setSubmitting(true)

    const result = await placeWebOrderAction(
      JSON.stringify({
        ...form,
        items: lines.map(({ item }) => item),
        pickupAt: isLalamove ? form.pickupAt : undefined,
        lalamoveAccepted: isLalamove ? true : undefined,
        paymentProofKey: needsProof ? proof?.key : undefined,
      }),
      token || undefined,
    )

    setSubmitting(false)
    if (result.ok) {
      writeCart([])
      router.push(`/order/${result.publicToken}`)
      return
    }

    // Tokens are single-use, so get a fresh one after any failure
    setBanner(result.error)
    setToken("")
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
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
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* Cart */}
      <div className={card}>
        <h2 className="font-bold">Your cart</h2>
        {lines.map(({ index, item, product }) => (
          <div
            key={index}
            className="flex justify-between gap-4 border-b border-black-haze-200 pb-3 text-sm last:border-0"
          >
            <div>
              <p className="font-semibold">{product.name}</p>
              {Object.keys(item.variations).length > 0 && (
                <p className="text-mine-shaft-600">
                  {Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </p>
              )}
              <p className="text-mine-shaft-500">{formatPeso(Number(product.price))}</p>
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

      {/* Delivery and payment */}
      <div className={card}>
        <h2 className="font-bold">Delivery and payment</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={label}>Delivery</span>
            <select
              className={input}
              value={form.deliveryMethod}
              onChange={(e) => {
                const method = e.target.value as "JNT" | "LALAMOVE"
                setForm((f) => ({
                  ...f,
                  deliveryMethod: method,
                  paymentMethod:
                    method === "LALAMOVE" && f.paymentMethod === "Cash on delivery"
                      ? PAYMENT_METHODS[0]
                      : f.paymentMethod,
                }))
              }}
            >
              <option value="JNT">J&amp;T (we book it)</option>
              <option value="LALAMOVE">Lalamove (same day, Metro Manila)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Payment</span>
            <select
              className={input}
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
            >
              {PAYMENT_METHODS.filter((m) => !(isLalamove && m === "Cash on delivery")).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          {needsProof && (
            <label className="flex flex-col gap-1">
              <span className={label}>Payment screenshot</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={proofBusy}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadProof(file)
                }}
                className="text-sm"
              />
              <span className="text-xs text-mine-shaft-500">
                {proofBusy ? "Uploading…" : proof ? `Uploaded: ${proof.name}` : "Required for GCash and bank transfer."}
              </span>
            </label>
          )}
        </div>

        {isLalamove && (
          <>
            <p className="whitespace-pre-line rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
              {LALAMOVE_DISCLAIMER}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lalamoveAccepted}
                onChange={(e) => setLalamoveAccepted(e.target.checked)}
              />
              I understand
            </label>
            <label className="flex flex-col gap-1">
              <span className={label}>Pickup time</span>
              <select
                required
                className={input}
                value={form.pickupAt}
                onChange={(e) => set("pickupAt", e.target.value)}
              >
                <option value="">Choose a time</option>
                {slots.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      {/* Customer */}
      <div className={card}>
        <h2 className="font-bold">Your details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={label}>Full name</span>
            <input required className={input} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Phone</span>
            <input
              required
              inputMode="tel"
              placeholder="09171234567"
              className={input}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className={label}>Address</span>
            <input required className={input} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>City</span>
            <input required className={input} value={form.city} onChange={(e) => set("city", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Province</span>
            <input required className={input} value={form.province} onChange={(e) => set("province", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Postal code</span>
            <input className={input} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className={label}>Notes (optional)</span>
          <textarea rows={2} className={input} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </label>
      </div>

      {/* Totals */}
      <div className={card}>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span>Products</span>
            <span>{formatPeso(productTotal)}</span>
          </div>
          {isLalamove ? (
            <div className="flex justify-between text-mine-shaft-600">
              <span>Lalamove</span>
              <span>Paid to Lalamove</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{quote?.ok ? formatPeso(shipping) : "Enter your province"}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between">
                  <span>COD fee</span>
                  <span>{formatPeso(codFee)}</span>
                </div>
              )}
              {quote && !quote.ok && <p className="text-amber-700">{quote.error}</p>}
            </>
          )}
          <div className="mt-2 flex justify-between border-t border-black-haze-200 pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatPeso(total)}</span>
          </div>
        </div>
        <p className="text-xs text-mine-shaft-500">
          After you place the order, we&apos;ll message you with payment details. Your order is held for 24 hours.
        </p>
      </div>

      {TURNSTILE_SITE_KEY && <div ref={widgetRef} />}

      {banner && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{banner}</p>}

      <button type="submit" disabled={!canSubmit} className={button}>
        {submitting ? "Placing order…" : "Place order"}
      </button>
    </form>
  )
}