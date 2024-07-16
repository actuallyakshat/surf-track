import type { DailyData, ScreenTimeData, ScreenTimeEntry } from "@/types/types"

export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${remainingSeconds}s`
  }
}

export function sortScreenTimeData(
  screenTimeData: ScreenTimeData
): ScreenTimeData {
  const sortedScreenTimeData: ScreenTimeData = {}

  // Iterate over each week in the screen time data
  for (const [week, weekData] of Object.entries(screenTimeData)) {
    sortedScreenTimeData[week] = {}

    // Iterate over each date in the week
    for (const [date, dailyData] of Object.entries(weekData)) {
      const entries = Object.entries(dailyData)
      const sortedEntries = entries.sort(
        ([, a], [, b]) => b.timeSpent - a.timeSpent
      )
      sortedScreenTimeData[week][date] = Object.fromEntries(sortedEntries)
      console.log(
        `Sorted data for ${date} in week ${week}:`,
        sortedScreenTimeData[week][date]
      )
    }
  }

  return sortedScreenTimeData
}

export function openNewTab(url: string) {
  chrome.tabs.create({ url: `http://${url}` })
}

export function getWeekNumber(date: Date): number {
  // Create a copy of the date to avoid mutating the original
  const tempDate = new Date(date.getTime())

  // Set to the nearest Monday
  const dayOfWeek = tempDate.getDay()
  const distanceToMonday = (dayOfWeek + 6) % 7 // Distance from Monday (0 for Monday, 1 for Sunday)
  tempDate.setDate(tempDate.getDate() - distanceToMonday)

  // Set to the start of the year
  const startOfYear = new Date(tempDate.getFullYear(), 0, 1)
  const daysFromStartOfYear = Math.floor(
    (tempDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate week number
  const weekNumber = Math.ceil((daysFromStartOfYear + 1) / 7)

  return weekNumber
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString("default", { month: "long" })
  const daySuffix = (day: number) => {
    if (day > 3 && day < 21) return "th"
    switch (day % 10) {
      case 1:
        return "st"
      case 2:
        return "nd"
      case 3:
        return "rd"
      default:
        return "th"
    }
  }

  return `${day}${daySuffix(day)} ${month}`
}

export function sortScreenTimeDataForDate(dailyData: DailyData): DailyData {
  // Convert the dailyData object to an array of entries
  const entries = Object.entries(dailyData) as [string, ScreenTimeEntry][]

  // Sort the entries based on timeSpent in descending order
  const sortedEntries = entries.sort(
    ([, a], [, b]) => b.timeSpent - a.timeSpent
  )

  // Convert the sorted entries back to an object
  const sortedDailyData: DailyData = Object.fromEntries(sortedEntries)

  console.log("Sorted daily data:", sortedDailyData)
  return sortedDailyData
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0") // Months are 0-based, so +1
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
