// Verifies a Cloudflare Turnstile token. Tokens are single-use, so call this once per order.
export async function verifyTurnstile(token: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    // Allowed in development so you can test without keys. In production, refuse.
    if (process.env.NODE_ENV === "production")
      throw new Error("Checkout is not configured yet. Please try again later.")
    console.warn("TURNSTILE_SECRET_KEY is not set; skipping check (development only)")
    return
  }

  if (!token) throw new Error("Please complete the security check and try again.")

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token }),
    signal: AbortSignal.timeout(10000),
  })
  const data = await res.json().catch(() => ({ success: false }))

  if (!data.success) throw new Error("Security check failed. Please try again.")
}