import { after } from "next/server"
import { verifySignature } from "@/lib/meta"
import { handleMessengerEvent } from "@/lib/inbox"

export const dynamic = "force-dynamic"

// Meta's verification handshake, run when you click "Verify and save"
export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN)
    return new Response(challenge ?? "", { status: 200 })
  return new Response("Forbidden", { status: 403 })
}

// Incoming events
export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256")))
    return new Response("Invalid signature", { status: 401 })

  type MetaWebhook = {
    object?: string
    entry?: { messaging?: unknown[] }[]
  }

  let payload: MetaWebhook
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response("Bad request", { status: 400 })
  }
  if (payload.object !== "page") return new Response("ignored", { status: 200 })

  // Reply to Meta right away, then process the events after the response is sent.
  // Meta retries slow deliveries, so the response has to come back fast.
  after(async () => {
    for (const entry of payload.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        try {
          await handleMessengerEvent(event as Parameters<typeof handleMessengerEvent>[0])
        } catch (err) {
          console.error("Messenger event failed:", err)
        }
      }
    }
  })

  return new Response("EVENT_RECEIVED", { status: 200 })
}