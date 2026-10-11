// lib/schedule.ts
// Philippines has no daylight saving time, so a fixed +8 offset is safe.
const MANILA_OFFSET_HOURS = 8

export const SCHEDULE = {
  openHour: 9,            // first pickup slot (9:00 AM)
  closeHour: 18,          // no slots starting at or after this hour (last slot 5:00 PM)
  openDays: [1, 2, 3, 4, 5, 6], // 0 = Sunday, 1 = Monday ... 6 = Saturday
  minLeadMinutes: 120,    // earliest bookable time is 2 hours from now
  closedDates: [] as string[], // "YYYY-MM-DD" in Manila time, e.g. ["2026-12-25"]
  daysAhead: 3,           // how many days of slots are offered
}

const pad = (n: number) => String(n).padStart(2, "0")

// Manila wall-clock time -> real Date
function manilaToDate(y: number, m: number, d: number, h: number) {
  return new Date(Date.UTC(y, m - 1, d, h - MANILA_OFFSET_HOURS))
}

// Current Manila date, read from a shifted UTC value
function manilaParts(now: Date) {
  const shifted = new Date(now.getTime() + MANILA_OFFSET_HOURS * 3600_000)
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  }
}

export function getBookingSlots(now: Date = new Date()) {
  const earliest = now.getTime() + SCHEDULE.minLeadMinutes * 60_000
  const today = manilaParts(now)
  const slots: { startsAt: Date; label: string }[] = []

  for (let i = 0; i < SCHEDULE.daysAhead; i++) {
    // Date arithmetic in UTC so month and year rollover work
    const day = new Date(Date.UTC(today.y, today.m - 1, today.d + i))
    const y = day.getUTCFullYear()
    const m = day.getUTCMonth() + 1
    const d = day.getUTCDate()
    const dateKey = `${y}-${pad(m)}-${pad(d)}`

    if (!SCHEDULE.openDays.includes(day.getUTCDay())) continue
    if (SCHEDULE.closedDates.includes(dateKey)) continue

    for (let h = SCHEDULE.openHour; h < SCHEDULE.closeHour; h++) {
      const startsAt = manilaToDate(y, m, d, h)
      if (startsAt.getTime() < earliest) continue

      slots.push({
        startsAt,
        label: new Intl.DateTimeFormat("en-PH", {
          timeZone: "Asia/Manila",
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(startsAt),
      })
    }
  }

  return slots
}

// Server-side check so a made-up or stale time can't be saved
export function isValidPickupTime(startsAt: Date, now: Date = new Date()) {
  return getBookingSlots(now).some((s) => s.startsAt.getTime() === startsAt.getTime())
}