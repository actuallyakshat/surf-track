import { formatLocalDate, getWeekNumber } from "@/lib/functions"

export function handleTabChange(
  url: string,
  currentUrl: string,
  startTime: number,
  favicon: string | undefined
) {
  console.log("Tab changed to:", url)
  if (currentUrl) {
    console.log("Previous URL:", currentUrl)
    const endTime = Date.now()
    const timeSpent = Math.round((endTime - startTime) / 1000)
    if (timeSpent < 5) {
      return
    }
    updateScreenTime(new URL(currentUrl).hostname, timeSpent, favicon)
  }

  return { currentUrl: url, startTime: Date.now(), favicon: favicon }
}

export function updateScreenTime(
  domain: string,
  timeSpent: number,
  favicon: string | undefined
): void {
  console.log("Updating screen time for domain:", domain)

  // Get the local date as YYYY-MM-DD format
  const today = new Date()
  const localDateKey = formatLocalDate(today)

  chrome.storage.sync.get(["screenTimeData"], (result) => {
    const data = result.screenTimeData || {}
    console.log("Current screen time data before update:", data)
    const currentWeek = getWeekNumber(today)

    if (!data[currentWeek]) {
      data[currentWeek] = {}
    }

    if (!data[currentWeek][localDateKey]) {
      data[currentWeek][localDateKey] = {}
    }

    if (!data[currentWeek][localDateKey][domain]) {
      data[currentWeek][localDateKey][domain] = {
        timeSpent: 0,
        favicon: favicon || undefined,
        weekNumber: currentWeek
      }
    }

    if (
      !data[currentWeek][localDateKey][domain].favicon ||
      data[currentWeek][localDateKey][domain].favicon != favicon
    ) {
      data[currentWeek][localDateKey][domain].favicon = favicon || undefined
    }

    data[currentWeek][localDateKey][domain].timeSpent += timeSpent

    console.log("Updated screen time data:", data)
    chrome.storage.sync.set({ screenTimeData: data })
  })
}
