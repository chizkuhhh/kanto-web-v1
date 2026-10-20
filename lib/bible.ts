import { prisma } from "@/lib/prisma"
import { BIBLE_DEFAULT } from "@/lib/bibleDefault"

// Cached per server instance for a minute. Saving clears the cache on the instance that saved;
// other instances pick up the change within the minute.
const TTL_MS = 60_000
let cache: { text: string; at: number } | null = null

export async function getBible(): Promise<string> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.text
  const latest = await prisma.agentBibleVersion.findFirst({ orderBy: { createdAt: "desc" } })
  const text = latest?.content ?? BIBLE_DEFAULT
  cache = { text, at: Date.now() }
  return text
}

export function clearBibleCache() {
  cache = null
}