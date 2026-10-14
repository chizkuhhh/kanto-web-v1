import { prisma } from "@/lib/prisma"
import { sendText } from "@/lib/meta"

type MessagingEvent = {
  sender: { id: string }
  recipient: { id: string }
  message?: { mid: string; text?: string; is_echo?: boolean }
}

const PLACEHOLDER_REPLY =
  "Thanks for messaging Kanto PH! Our order assistant is being set up. A team member will reply soon."

export async function handleMessengerEvent(event: MessagingEvent) {
  const msg = event.message
  if (!msg?.text) return // reads, deliveries, and attachments are ignored for now

  // For echoes, the customer is the recipient. For incoming messages, the sender.
  const customerId = msg.is_echo ? event.recipient.id : event.sender.id

  if (msg.is_echo) {
    // Our own sends come back as echoes too. Those are already stored, so skip them.
    const ours = await prisma.message.findUnique({ where: { metaMessageId: msg.mid } })
    if (ours) return

    // Anything else was sent by a person from the Page inbox: pause the bot for this customer
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

  // Customer message. Skip anything we've already stored, since Meta can redeliver.
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

  const reply = PLACEHOLDER_REPLY
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