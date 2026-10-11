"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Option = { value: string; label: string }

const selectClass =
  "text-sm border border-black-haze-300 rounded-full px-3 py-2 bg-black-haze-50 text-mine-shaft-700"

export default function OrderFilters({ statuses, channels }: { statuses: Option[]; channels: Option[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        aria-label="Filter by status"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className={selectClass}
      >
        <option value="">All statuses</option>
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        aria-label="Filter by channel"
        value={searchParams.get("channel") ?? ""}
        onChange={(e) => update("channel", e.target.value)}
        className={selectClass}
      >
        <option value="">All channels</option>
        {channels.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </div>
  )
}