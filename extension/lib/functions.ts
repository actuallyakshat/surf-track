import type { ScreenTimeData } from "@/types/types"

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

  for (const [date, dailyData] of Object.entries(screenTimeData)) {
    const entries = Object.entries(dailyData)
    const sortedEntries = entries.sort(
      ([, a], [, b]) => b.timeSpent - a.timeSpent
    )
    sortedScreenTimeData[date] = Object.fromEntries(sortedEntries)
    console.log(`Sorted data for ${date}:`, sortedScreenTimeData[date])
  }

  return sortedScreenTimeData
}

export function openNewTab(url: string) {
  chrome.tabs.create({ url: `http://${url}` })
}
