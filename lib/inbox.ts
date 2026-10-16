import { prisma } from "@/lib/prisma"
import { sendText } from "@/lib/meta"
import { runAgent, type HistoryTurn } from "@/lib/agent/run"

type MessagingEvent = {
  sender: { id: string }
  recipient: { id: string }
  message?: { mid: string; text?: string; is_echo?: boolean }
}

const FALLBACK_REPLY =
  "Sorry, I'm having trouble right now. A team member will get back to you shortly."

export async function handleMessengerEvent(event: MessagingEvent) {
  const msg = event.message
  if (!msg?.text) return

  const customerId = msg.is_echo ? event.recipient.id : event.sender.id

  if (msg.is_echo) {
    const ours = await prisma.message.findUnique({ where: { metaMessageId: msg.mid } })
    if (ours) return

    const conv = await prisma.conversation.upsert({
      where: { channel_senderId: { channel: "MESSENGER", senderId: customerId } },
      create: { channel: "MESSENGER", senderId: customerId, botPaused: true },
      update: { botPaused: true },
    })
    await prisma.message.create({
      data: { conversationId: conv.id, role: "human", text: msg.text, metaMessageId: msg.mid },
    })
    return
  }

  const seen = await prisma.message.findUnique({ where: { metaMessageId: msg.mid } })
  if (seen) return

  const conv = await prisma.conversation.upsert({
    where: { channel_senderId: { channel: "MESSENGER", senderId: customerId } },
    create: { channel: "MESSENGER", senderId: customerId },
    update: { lastMessageAt: new Date() },
  })
  await prisma.message.create({
    data: { conversationId: conv.id, role: "customer", text: msg.text, metaMessageId: msg.mid },
  })

  if (conv.botPaused) return

  // Last 30 turns, oldest first
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
    reply = await runAgent({ conversationId: conv.id, channel: "MESSENGER" }, history)
  } catch (err) {
    console.error("Agent failed:", err)
    reply = FALLBACK_REPLY
  }
  if (!reply) return

  const sentId = await sendText(customerId, reply)
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      role: "agent",
      text: reply,
      metaMessageId: sentId ?? null,
    },
  })
}