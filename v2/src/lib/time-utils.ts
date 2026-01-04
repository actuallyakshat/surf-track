export function formatSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

export function getYearWeek(date: Date = new Date()): string {
  // ISO 8601 week number calculation
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )
  return `${d.getUTCFullYear()}_${String(weekNo).padStart(2, "0")}`
}

export function getTodayDate(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00") // Ensure local time doesn't shift date
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" })
  const day = date.getDate()
  return `${weekday} ${day}`
}

export function formatDateHeader(
  startDateStr: string,
  endDateStr?: string
): string {
  const startDate = new Date(startDateStr + "T00:00:00")

  if (!endDateStr) {
    return startDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    })
  }

  const endDate = new Date(endDateStr + "T00:00:00")

  // Format: "Jan 1 - Jan 7, 2026" or "Dec 30, 2025 - Jan 5, 2026"
  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" })
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" })
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()

  if (startYear !== endYear) {
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`
  } else if (startMonth !== endMonth) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`
  } else {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`
  }
}

export function getWeekDates(input: string): string[] {
  let date: Date

  if (input.includes("_")) {
    // Handle YYYY_WW format
    const [year, week] = input.split("_").map(Number)
    // Start with Jan 4th of that year (which is always in week 1)
    date = new Date(Date.UTC(year, 0, 4))
    // Find the Monday of that week
    const day = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - day) // This gets us to Thursday of Week 1
    // Now move to the target week's Monday
    date.setUTCDate(date.getUTCDate() + (week - 1) * 7 - 3)
  } else {
    // Handle ISO date string
    date = new Date(input + "T00:00:00")
  }

  // Find the Monday of this week
  const day = date.getDay() // 0 = Sunday, 1 = Monday, etc.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(date)
  monday.setDate(diff)

  // Generate 7 dates starting from Monday
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const dayOfMonth = String(d.getDate()).padStart(2, "0")
    dates.push(`${y}-${m}-${dayOfMonth}`)
  }

  return dates
}
