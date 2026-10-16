"use client"

import { useState } from "react"

export default function CopyTrackingLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked, so show the link for manual copying
      window.prompt("Copy the tracking link:", url)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full px-4 h-9 text-sm font-semibold border border-black-haze-300 hover:bg-black-haze-100"
    >
      {copied ? "Copied" : "Copy tracking link"}
    </button>
  )
}