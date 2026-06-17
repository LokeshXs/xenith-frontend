// The calendar day (YYYY-MM-DD) a Date falls on, in the given IANA tz.
// en-CA renders ISO-like YYYY-MM-DD, which sorts/compares cleanly.
function dayKeyInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// Today's calendar day (YYYY-MM-DD) in the given IANA tz.
export function todayKeyInTimezone(timeZone: string): string {
  return dayKeyInTimezone(new Date(), timeZone)
}

// "Today" / "Yesterday" / "May 28" / "May 28, 2024" for a YYYY-MM-DD key,
// relative to now in the given timezone. The key is already tz-local (e.g. from
// the API), so we only format it for display.
export function formatDayLabel(dayKey: string, timeZone: string): string {
  const now = new Date()
  const todayKey = dayKeyInTimezone(now, timeZone)
  const yesterdayKey = dayKeyInTimezone(
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
    timeZone,
  )
  if (dayKey === todayKey) return 'Today'
  if (dayKey === yesterdayKey) return 'Yesterday'

  // dayKey is YYYY-MM-DD — parse as a plain date (noon UTC avoids tz edge cases).
  const date = new Date(`${dayKey}T12:00:00Z`)
  const sameYear = dayKey.slice(0, 4) === todayKey.slice(0, 4)
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date)
}
