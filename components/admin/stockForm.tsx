import { formatVariantLabel } from "@/lib/variantLabel"

type Row = { id: string; options: unknown; stock: number; active: boolean }

const label = "text-xs font-semibold uppercase tracking-wide text-mine-shaft-500"
const input = "w-24 rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm"

export default function StockForm({
  variants,
  action,
}: {
  variants: Row[]
  action: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5">
      <h2 className="font-bold">Stock</h2>
      <p className="text-xs text-mine-shaft-500">
        Orders reduce these counts automatically. Only enter a new number when you&apos;ve counted stock.
      </p>

      <div className="flex flex-col divide-y divide-black-haze-200">
        {variants.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm">
                {formatVariantLabel(v.options)}
                {!v.active && <span className="ml-2 text-xs text-mine-shaft-500">(removed)</span>}
            </span>
            <div className="flex items-center gap-2">
              <span className={label}>In stock</span>
              {/* Stock value loaded with the page, used to detect changes made while editing */}
              <input type="hidden" name={`prev_${v.id}`} value={v.stock} />
              <input
                name={`stock_${v.id}`}
                inputMode="numeric"
                defaultValue={v.stock}
                className={input}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <button
          type="submit"
          className="rounded-full px-4 h-10 text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900"
        >
          Save stock
        </button>
      </div>
    </form>
  )
}