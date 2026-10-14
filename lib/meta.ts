import { createHmac, timingSafeEqual } from "crypto"

const GRAPH = "https://graph.facebook.com/v23.0"

// Checks that the request really came from Meta, using the raw body
export function verifySignature(rawBody: string, header: string | null) {
  const secret = process.env.META_APP_SECRET
  if (!secret || !header?.startsWith("sha256=")) return false
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")
  const given = header.slice("sha256=".length)
  if (given.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

// Sends a text reply and returns Meta's message id, which we store to recognize our own echoes
export async function sendText(recipientId: string, text: string) {
  const token = process.env.META_PAGE_TOKEN
  if (!token) throw new Error("META_PAGE_TOKEN is not set")

  const res = await fetch(`${GRAPH}/me/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text },
    }),
    signal: AbortSignal.timeout(10000),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Send failed ${res.status}: ${data?.error?.message ?? "unknown"}`)
  return data.message_id as string | undefined
}