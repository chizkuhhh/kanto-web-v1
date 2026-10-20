import { createHmac, timingSafeEqual } from "crypto"

// Checks the signature Chatwoot sends with each webhook.
// Header name and format are unconfirmed; CHATWOOT_DEBUG=1 logs the headers so we can verify on the first real payload.
export function verifyChatwootSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
) {
  const secret = process.env.CHATWOOT_WEBHOOK_SECRET
  if (!secret || !signature || !timestamp) return false

  // Reject stale requests (more than 5 minutes old)
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false

  const given = signature.startsWith("sha256=") ? signature.slice(7) : signature
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex")
  if (given.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

function config() {
  const baseUrl = process.env.CHATWOOT_BASE_URL
  const token = process.env.CHATWOOT_API_TOKEN
  if (!baseUrl || !token) throw new Error("CHATWOOT_BASE_URL or CHATWOOT_API_TOKEN is not set")
  return { baseUrl: baseUrl.replace(/\/$/, ""), token }
}

async function cwPost(path: string, body: unknown) {
  const { baseUrl, token } = config()
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", api_access_token: token },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Chatwoot ${path} failed ${res.status}: ${JSON.stringify(data)}`)
  return data
}

// Posts the bot's reply into the conversation. Chatwoot does not read webhook responses, so this call is the only way the customer gets the reply.
export async function sendBotMessage(accountId: number, conversationId: number, content: string) {
  const data = await cwPost(
    `/accounts/${accountId}/conversations/${conversationId}/messages`,
    { content, message_type: "outgoing", private: false },
  )
  return data.id as number | undefined
}

// Moves the conversation to "open" so a human takes over and the bot stops replying.
export async function setConversationOpen(accountId: number, conversationId: number) {
  await cwPost(`/accounts/${accountId}/conversations/${conversationId}/toggle_status`, {
    status: "open",
  })
}