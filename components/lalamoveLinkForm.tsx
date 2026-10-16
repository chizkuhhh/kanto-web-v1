"use client"

import { useState } from "react"
import { saveLalamoveLinkAction } from "@/app/order/[token]/actions"

const input = "w-full rounded-lg border border-black-haze-300 bg-black-haze-50 px-3 py-2 text-sm"
const button =
  "rounded-full px-4 h-10 text-sm font-semibold bg-mine-shaft-800 text-black-haze-100 hover:bg-mine-shaft-900 disabled:opacity-50"

export default function LalamoveLinkForm({ token, existing }: { token: string; existing: string | null }) {
  const [link, setLink] = useState(existing ?? "")
  const [saved, setSaved] = useState(Boolean(existing))
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError("")
    const res = await saveLalamoveLinkAction(token, link)
    setBusy(false)
    if (res.ok) setSaved(true)
    else setError(res.error)
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-mine-shaft-500">
          Lalamove booking link
        </span>
        <input
          required
          placeholder="https://"
          value={link}
          onChange={(e) => {
            setLink(e.target.value)
            setSaved(false)
          }}
          className={input}
        />
      </label>
      <div>
        <button type="submit" disabled={busy || !link.trim()} className={button}>
          {busy ? "Saving…" : saved ? "Saved" : "Save link"}
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  )
}