"use client"

import { useState } from "react"
import { createManualOrderAction, lookupCustomerAction } from "@/app/admin/orders/new/actions"
import { PAYMENT_METHODS } from "@/lib/orderLabels"
import { formatPeso } from "@/lib/format"

type Product = {
  id: string
  name: string
  price: string | null
  weightGrams: number | null
  variations: { type: string; options: string[] }[]
}
type Slot = { value: string; label: string }
type Item = { productId: string; quantity: number; variations: Record<string, string> }

const label = "text-xs font-semibold uppercase tracking-wide text-mine-shaft-500"
const input = "w-full rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm"
const card = "flex flex-col gap-4 rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5"

export default function NewOrderForm({ products, slots }: { products: Product[]; slots: Slot[] }) {
  const [form, setForm] = useState({
    channel: "MANUAL",
    deliveryMethod: "JNT",
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
  const [items, setItems] = useState<Item[]>([
    { productId: products[0]?.id ?? "", quantity: 1, variations: {} },
  ])
  const [banner, setBanner] = useState("")

  const productById = new Map(products.map((p) => [p.id, p]))
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))

  function setItem(index: number, patch: Partial<Item>) {
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  // Shows the product subtotal as a preview. The server recalculates it on save.
  const subtotal = items.reduce((sum, item) => {
    const p = productById.get(item.productId)
    return p?.price ? sum + Number(p.price) * item.quantity : sum
  }, 0)
  const totalGrams = items.reduce((sum, item) => {
    const p = productById.get(item.productId)
    return p?.weightGrams ? sum + p.weightGrams * item.quantity : sum
  }, 0)

  async function checkCustomer() {
    if (!form.phone.trim()) return
    const found = await lookupCustomerAction(form.phone)
    if (!found) {
      setBanner("")
      return
    }
    setForm((f) => ({
      ...f,
      name: found.name,
      address: found.address,
      city: found.city,
      province: found.province,
      postalCode: found.postalCode,
    }))
    setBanner("Returning customer. Details filled in from their last order. Please confirm them.")
  }

  return (
    <form
      className="flex flex-col gap-6"
      action={async () => {
        await createManualOrderAction(
          JSON.stringify({
            ...form,
            items,
            pickupAt: form.deliveryMethod === "LALAMOVE" ? form.pickupAt : undefined,
          }),
        )
      }}
    >
      {/* Order setup */}
      <div className={card}>
        <h2 className="font-bold">Order</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className={label}>Channel</span>
            <select className={input} value={form.channel} onChange={(e) => set("channel", e.target.value)}>
              <option value="MANUAL">Manual</option>
              <option value="MESSENGER">Messenger</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="WEB">Website</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Delivery</span>
            <select
              className={input}
              value={form.deliveryMethod}
              onChange={(e) => {
                const method = e.target.value
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
              <option value="JNT">J&amp;T (you book)</option>
              <option value="LALAMOVE">Lalamove (customer books)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Payment</span>
            <select className={input} value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              {PAYMENT_METHODS.filter((m) => !(form.deliveryMethod === "LALAMOVE" && m === "Cash on delivery")).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>

        {form.deliveryMethod === "LALAMOVE" && (
          <label className="flex flex-col gap-1">
            <span className={label}>Pickup time</span>
            <select required className={input} value={form.pickupAt} onChange={(e) => set("pickupAt", e.target.value)}>
              <option value="">Choose a time</option>
              {slots.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        )}
        {form.deliveryMethod === "JNT" && form.paymentMethod === "Cash on delivery" && (
          <p className="text-xs text-mine-shaft-500">
            The COD fee (2.75% plus VAT on the product total) is added when the order is saved.
          </p>
        )}
      </div>

      {/* Customer */}
      <div className={card}>
        <h2 className="font-bold">Customer</h2>
        {banner && <p className="text-sm text-blue-800 bg-blue-50 rounded-lg px-3 py-2">{banner}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className={label}>Phone</span>
            <input
              required
              inputMode="tel"
              placeholder="09171234567"
              className={input}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={checkCustomer}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Name</span>
            <input required className={input} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          {form.deliveryMethod === "JNT" && (
            <>
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
            </>
          )}
          {form.deliveryMethod === "LALAMOVE" && (
            <p className="text-xs text-mine-shaft-500 md:col-span-2">
              No address needed. The customer enters the drop-off in their Lalamove booking.
            </p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className={card}>
        <h2 className="font-bold">Items</h2>
        {items.map((item, i) => {
          const product = productById.get(item.productId)
          return (
            <div key={i} className="flex flex-col gap-3 border-b border-black-haze-200 pb-4 last:border-0">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_6rem] gap-3">
                <select
                  className={input}
                  value={item.productId}
                  onChange={(e) => setItem(i, { productId: e.target.value, variations: {} })}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className={input}
                  value={item.quantity}
                  onChange={(e) => setItem(i, { quantity: Number(e.target.value) })}
                />
              </div>

              {product?.variations.map((v) => (
                <label key={v.type} className="flex flex-col gap-1">
                  <span className={label}>{v.type}</span>
                  <select
                    required
                    className={input}
                    value={item.variations[v.type] ?? ""}
                    onChange={(e) =>
                      setItem(i, { variations: { ...item.variations, [v.type]: e.target.value } })
                    }
                  >
                    <option value="">Choose</option>
                    {v.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems((list) => list.filter((_, idx) => idx !== i))}
                  className="self-start text-sm text-red-700 hover:underline"
                >
                  Remove item
                </button>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => setItems((list) => [...list, { productId: products[0]?.id ?? "", quantity: 1, variations: {} }])}
          className="self-start text-sm font-semibold underline underline-offset-2"
        >
          Add another item
        </button>

        <div className="border-t border-black-haze-200 pt-3 text-sm flex flex-col gap-1">
          <div className="flex justify-between"><span>Products (preview)</span><span>{formatPeso(subtotal)}</span></div>
          <div className="flex justify-between text-mine-shaft-600">
            <span>Total weight</span>
            <span>{totalGrams} g{form.deliveryMethod === "JNT" && totalGrams > 5000 ? " (over J&T's 5 kg limit)" : ""}</span>
          </div>
          <p className="text-xs text-mine-shaft-500">Shipping and fees are calculated and checked when you save.</p>
        </div>
      </div>

      {/* Notes and submit */}
      <div className={card}>
        <label className="flex flex-col gap-1">
          <span className={label}>Notes</span>
          <textarea rows={3} className={input} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </label>
        <div>
          <button
            type="submit"
            className="rounded-full px-4 h-10 text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900"
          >
            Create order
          </button>
        </div>
      </div>
    </form>
  )
}