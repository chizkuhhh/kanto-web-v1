const OPENS_BEFORE_MS = 15 * 60_000

export function linkOpensAt(pickupAt: Date) {
  return new Date(pickupAt.getTime() - OPENS_BEFORE_MS)
}

export function isLinkWindowOpen(pickupAt: Date | null, now = new Date()) {
  return pickupAt !== null && now >= linkOpensAt(pickupAt)
}