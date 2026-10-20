import { prisma } from "@/lib/prisma"
import { sendBotMessage } from "@/lib/chatwoot"
import { runAgent, type HistoryTurn } from "@/lib/agent/run"

export type ChatwootMessageEvent = {
  event: string
  id: number
  content?: string | null
  message_type?: string | number
  private?: boolean
  sender?: { type?: string; id?: number }
  conversation: {
    id: number
    display_id?: number
    meta?: { channel?: string }
    channel?: string
  }
  account: { id: number }
}

const FALLBACK_REPLY =
  "Sorry, I'm having trouble right now. A team member will get back to you shortly."

export async function handleChatwootMessage(event: ChatwootMessageEvent) {
  if (event.private || !event.content) return

  const accountId = event.account.id
  const cwConversationId = event.conversation.display_id ?? event.conversation.id
  const channelName = event.conversation.channel ?? event.conversation.meta?.channel
  const channel = channelName === "Channel::Instagram" ? "INSTAGRAM" : "MESSENGER"
  const senderId = `cw:${accountId}:${cwConversationId}`
  const msgKey = `cw:${event.id}`
  const type = event.message_type

  // Skip the bot's own replies (they come back as outgoing events)
  if (type === "outgoing" && event.sender?.type === "agent_bot") return

  const seen = await prisma.message.findUnique({ where: { metaMessageId: msgKey } })
  if (seen) return

  if (type === "outgoing") {
    // A human on the team replied in Chatwoot: store it and stop the bot
    const conv = await prisma.conversation.upsert({
      where: { channel_senderId: { channel, senderId } },
      create: { channel, senderId, botPaused: true },
      update: { botPaused: true },
    })
    await prisma.message.create({
      data: { conversationId: conv.id, role: "human", text: event.content, metaMessageId: msgKey },
    })
    return
  }

  if (type !== "incoming" && type !== 0) return

  const conv = await prisma.conversation.upsert({
    where: { channel_senderId: { channel, senderId } },
    create: { channel, senderId },
    update: { lastMessageAt: new Date() },
  })
  await prisma.message.create({
    data: { conversationId: conv.id, role: "customer", text: event.content, metaMessageId: msgKey },
  })

  if (conv.botPaused) return

  const recent = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { role: true, text: true },
  })
  const history: HistoryTurn[] = recent
    .reverse()
    .map((m) => ({ role: m.role as HistoryTurn["role"], text: m.text }))

  let reply: string
  try {
    reply = await runAgent(
      { conversationId: conv.id, channel, chatwoot: { accountId, conversationId: cwConversationId } },
      history,
    )
  } catch (err) {
    console.error("Agent failed:", err)
    reply = FALLBACK_REPLY
  }
  if (!reply) return

  const sentId = await sendBotMessage(accountId, cwConversationId, reply)
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      role: "agent",
      text: reply,
      metaMessageId: sentId ? `cw:${sentId}` : null,
    },
  })
}