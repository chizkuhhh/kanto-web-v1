import { formatManilaDateTime } from "@/lib/format"
import { getJtZonesForAdmin } from "@/lib/jtZones"
import { updateJtZoneAction } from "./actions"

export const dynamic = "force-dynamic"

const label = "text-xs font-semibold uppercase tracking-wide text-mine-shaft-500"
const input = "w-full rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm"

export default async function JtRatesPage() {
  const zones = await getJtZonesForAdmin()

  return (
    <div className="flex flex-col items-center px-5 pt-32 pb-12 md:px-8 bg-black-haze-100 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">J&amp;T rates</h1>
          <p className="text-sm text-mine-shaft-600 mt-1">
            Prices are per parcel, by weight bracket. Each bracket rounds up: 2 kg uses the 3 kg price.
          </p>
        </div>

        {zones.map((z) => (
          <form
            key={z.id}
            action={updateJtZoneAction.bind(null, z.id)}
            className="flex flex-col gap-5 rounded-2xl border border-black-haze-200 bg-black-haze-50 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{z.name}</h2>
              <p className={`text-xs ${z.stale ? "text-amber-700" : "text-mine-shaft-500"}`}>
                {z.lastCheckedAt
                  ? `Last checked ${formatManilaDateTime(z.lastCheckedAt)}${z.stale ? " (over 90 days ago, recheck)" : ""}`
                  : "Never checked"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {z.rates.map((r) => (
                <label key={r.id} className="flex flex-col gap-1">
                  <span className={label}>Up to {r.maxWeightGrams / 1000} kg (₱)</span>
                  <input
                    name={`rate_${r.id}`}
                    inputMode="decimal"
                    defaultValue={r.price.toString()}
                    className={input}
                  />
                </label>
              ))}
            </div>

            <label className="flex flex-col gap-1">
              <span className={label}>Places (one per line)</span>
              <textarea
                name="provinces"
                rows={Math.min(12, z.provinces.length + 1)}
                defaultValue={z.provinces.join("\n")}
                className={input}
              />
            </label>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="markChecked" className="size-4" />
                I just checked these prices against J&amp;T&apos;s calculator
              </label>
              <button
                type="submit"
                className="rounded-full px-4 h-10 text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900"
              >
                Save {z.name}
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  )
}