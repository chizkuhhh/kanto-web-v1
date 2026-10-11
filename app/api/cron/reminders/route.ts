import { sendDailyDigest } from "@/lib/reminders"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return new Response("CRON_SECRET is not set", { status: 500 })
  if (request.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 })

  const sent = await sendDailyDigest()
  return Response.json({ sent })
}