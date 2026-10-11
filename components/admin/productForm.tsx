import type { Product } from "@prisma/client"
import Link from "next/link"

const label = "text-xs font-semibold uppercase tracking-wide text-mine-shaft-500"
const input = "w-full rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm"

export default function ProductForm({
  product,
  action,
}: {
  product: Product | null
  action: (formData: FormData) => Promise<void>
}) {
  const variationsText = JSON.stringify(product?.variations ?? [], null, 2)

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5">
      <label className="flex flex-col gap-1">
        <span className={label}>Name</span>
        <input name="name" required defaultValue={product?.name ?? ""} className={input} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={label}>Description</span>
        <textarea name="description" rows={4} defaultValue={product?.description ?? ""} className={input} />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1">
          <span className={label}>Category</span>
          <select name="category" defaultValue={product?.category ?? "PADDLE"} className={input}>
            <option value="PADDLE">Paddles</option>
            <option value="ACCESSORY">Accessories</option>
            <option value="ACTIVEWEAR">Activewear</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Price (₱)</span>
          <input name="price" inputMode="decimal" placeholder="1299.00" defaultValue={product?.price?.toString() ?? ""} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Packed weight (grams)</span>
          <input name="weightGrams" inputMode="numeric" placeholder="350" defaultValue={product?.weightGrams ?? ""} className={input} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={label}>Image URLs (one per line, https only)</span>
        <textarea name="images" rows={4} defaultValue={(product?.images ?? []).join("\n")} className={input} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={label}>Variations (JSON)</span>
        <textarea name="variations" rows={6} defaultValue={variationsText} className={`${input} font-mono text-xs`} />
        <span className="text-xs text-mine-shaft-500">
          Example: [{`{"type": "color", "options": ["blue", "red"]}`}, {`{"type": "style", "options": ["text", "mascot"]}`}]. Use [] for no options.
        </span>
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className={label}>Shopee link (during transition)</span>
          <input name="shopeeUrl" defaultValue={product?.shopeeUrl ?? ""} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>TikTok Shop link (during transition)</span>
          <input name="tiktokUrl" defaultValue={product?.tiktokUrl ?? ""} className={input} />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-full px-4 h-10 text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900">
          {product ? "Save product" : "Create product"}
        </button>
        <Link href="/admin/products" className="text-sm text-mine-shaft-600 hover:text-mine-shaft-900">
          Cancel
        </Link>
      </div>
    </form>
  )
}