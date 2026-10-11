import { purgeOldCustomerDetails } from "@/lib/retention"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  // Refuse to run if the secret isn't configured, so an empty value can't match
  if (!secret) return new Response("CRON_SECRET is not set", { status: 500 })
  if (request.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 })

  const purgedOrders = await purgeOldCustomerDetails()
  return Response.json({ purgedOrders })
}