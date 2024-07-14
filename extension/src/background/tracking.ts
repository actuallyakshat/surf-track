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
  const today = new Date().toISOString().split("T")[0]

  chrome.storage.local.get(["screenTimeData"], (result) => {
    const data = result.screenTimeData || {}
    console.log("Current screen time data before update:", data)

    if (!data[today]) {
      data[today] = {}
    }

    if (!data[today][domain]) {
      data[today][domain] = {
        timeSpent: 0,
        favicon: favicon || undefined
      }
    }

    data[today][domain].timeSpent += timeSpent

    console.log("Updated screen time data:", data)
    chrome.storage.local.set({ screenTimeData: data })
  })
}
