import { prisma } from "../lib/prisma"
import { runAgent, type HistoryTurn } from "../lib/agent/run"

const DEV_HOST = "ep-nameless-heart-az7ty9p1"
if (!(process.env.DATABASE_URL ?? "").includes(DEV_HOST))
  throw new Error("Refusing to run: DATABASE_URL is not the dev-phase2 branch.")

const text = process.argv.slice(2).join(" ").trim()
if (!text) throw new Error('Usage: npx tsx --env-file=.env.local scripts/test-agent.ts "your message"')

async function main() {
  const conv = await prisma.conversation.upsert({
    where: { channel_senderId: { channel: "MESSENGER", senderId: "local-test" } },
    create: { channel: "MESSENGER", senderId: "local-test" },
    update: {},
  })

  await prisma.message.create({
    data: { conversationId: conv.id, role: "customer", text },
  })

  const recent = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { role: true, text: true },
  })
  const history: HistoryTurn[] = recent
    .reverse()
    .map((m) => ({ role: m.role as HistoryTurn["role"], text: m.text }))

  const reply = await runAgent({ conversationId: conv.id, channel: "MESSENGER" }, history)
  console.log(`\nAgent:\n${reply}\n`)

  await prisma.message.create({
    data: { conversationId: conv.id, role: "agent", text: reply },
  })
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())