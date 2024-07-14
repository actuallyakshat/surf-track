import { formatSeconds } from "@/lib/functions"
import React, { useEffect, useState } from "react"

interface ScreenTimeEntry {
  favicon?: string
  timeSpent: number
}

interface DailyData {
  [domain: string]: ScreenTimeEntry
}

interface ScreenTimeData {
  [date: string]: DailyData
}

export default function ScreenTime() {
  const [data, setData] = useState<ScreenTimeData>({})
  const [todayData, setTodayData] = useState<DailyData>({})

  useEffect(() => {
    function getData() {
      console.log("Getting data")
      chrome.storage.local.get(["screenTimeData"], (result) => {
        // Type assertion to ensure correct structure
        const screenTimeData = (result.screenTimeData as ScreenTimeData) || {}

        // Initialize sorted data object
        const sortedScreenTimeData: ScreenTimeData = {}

        // Process each date's data
        for (const [date, dailyData] of Object.entries(screenTimeData)) {
          const entries = Object.entries(dailyData)
          const sortedEntries = entries.sort(
            ([, a], [, b]) => b.timeSpent - a.timeSpent
          )
          sortedScreenTimeData[date] = Object.fromEntries(sortedEntries)
          console.log(`Sorted data for ${date}:`, sortedScreenTimeData[date])
        }
        setData(sortedScreenTimeData)
        console.log("Sorted ScreenTimeData:", sortedScreenTimeData)

        // Update today's data
        const today = new Date().toISOString().split("T")[0] // Get date in YYYY-MM-DD format
        setTodayData(sortedScreenTimeData[today] || {})
      })
    }

    getData()
    const interval = setInterval(getData, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-4 space-y-4">
      {Object.keys(todayData).length > 0 ? (
        Object.keys(todayData)
          .filter((domain) => todayData[domain].favicon)
          .map((domain) => (
            <div key={domain} className="flex items-center">
              <img
                src={todayData[domain].favicon}
                className="size-12 mr-2"
                alt={domain}
              />
              {domain}: {formatSeconds(todayData[domain].timeSpent)}
            </div>
          ))
      ) : (
        <div>No data for today.</div>
      )}
    </div>
  )
}
