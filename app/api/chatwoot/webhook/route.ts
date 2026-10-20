import { after } from "next/server"
import { verifyChatwootSignature } from "@/lib/chatwoot"
import { handleChatwootMessage, type ChatwootMessageEvent } from "@/lib/inbox-chatwoot"

export const dynamic = "force-dynamic"

// Chatwoot agent bot webhook. Replies to Chatwoot right away, then processes the message after the response.
export async function POST(request: Request) {
  const rawBody = await request.text()

  if (process.env.CHATWOOT_DEBUG === "1") {
    // Dev only: shows the headers and payload so we can confirm signature and field names
    console.log("chatwoot headers:", Object.fromEntries(request.headers.entries()))
    console.log("chatwoot body:", rawBody)
  }

  if (
    !verifyChatwootSignature(
      rawBody,
      request.headers.get("x-chatwoot-signature"),
      request.headers.get("x-chatwoot-timestamp"),
    )
  )
    return new Response("Invalid signature", { status: 401 })

  let event: ChatwootMessageEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response("Bad request", { status: 400 })
  }

  if (event.event !== "message_created") return new Response("ignored", { status: 200 })

  after(async () => {
    try {
      await handleChatwootMessage(event)
    } catch (err) {
      console.error("Chatwoot message failed:", err)
    }
  })

  return new Response("ok", { status: 200 })
}