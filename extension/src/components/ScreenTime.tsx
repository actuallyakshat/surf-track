import { formatSeconds, openNewTab, sortScreenTimeData } from "@/lib/functions"
import type { DailyData, ScreenTimeData } from "@/types/types"
import React, { useEffect, useState } from "react"

import { useGlobalContext } from "../context/globalContext"
import { ScreenTimeChart } from "./ScreenTimeChart"

export default function ScreenTime() {
  const { data: globalScreenTimeData } = useGlobalContext()
  const [data, setData] = useState<ScreenTimeData>({})
  const [todayData, setTodayData] = useState<DailyData>({})

  useEffect(() => {
    function getData() {
      console.log("Getting data")
      chrome.storage.local.get(["screenTimeData"], (result) => {
        let screenTimeData = globalScreenTimeData || {}
        const sortedScreenTimeData = sortScreenTimeData(screenTimeData)
        console.log("Sorted ScreenTimeData:", sortedScreenTimeData)

        const today = new Date().toISOString().split("T")[0]
        setTodayData(sortedScreenTimeData[today] || {})
      })
    }

    getData()
    const interval = setInterval(getData, 5000)
    return () => clearInterval(interval)
  }, [globalScreenTimeData])

  return (
    <div className="p-4 space-y-4">
      <ScreenTimeChart />
      <h2 className="text-lg font-semibold">Today's Activity</h2>
      {Object.keys(todayData).length > 0 ? (
        Object.keys(todayData)
          .filter((domain) => todayData[domain].favicon)
          .map((domain) => (
            <div key={domain} className="grid grid-cols-3 pr-6">
              <div className="flex items-center col-span-2 gap-2">
                <img
                  src={todayData[domain].favicon}
                  className="size-8 mr-2"
                  alt={domain}
                />
                <button
                  onClick={() => openNewTab(domain)}
                  className="hover:underline">
                  {domain}
                </button>
              </div>
              <p className="col-span-1 text-right">
                {formatSeconds(todayData[domain].timeSpent)}
              </p>
            </div>
          ))
      ) : (
        <h2 className="text-center text-muted-foreground text-sm py-2">
          No data for today.
        </h2>
      )}
    </div>
  )
}
