import {
  formatLocalDate,
  getWeekNumber,
  sortScreenTimeData,
  sortScreenTimeDataForDate
} from "@/lib/functions"
import type { DailyData, ScreenTimeData } from "@/types/types"
import React, { useEffect, useState } from "react"

import { useGlobalContext } from "../context/globalContext"
import DailyScreenTimeBreakdown from "./DailyScreenTimeBreakdown"
import { ScreenTimeChart } from "./ScreenTimeChart"

export default function ScreenTime() {
  const { data: globalScreenTimeData = {} } = useGlobalContext()
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyData | {}>({})
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()))

  useEffect(() => {
    function getData() {
      const date = new Date(selectedDate)
      const weekOfSelectedDate = getWeekNumber(date)
      const dayData = globalScreenTimeData[weekOfSelectedDate]?.[selectedDate]
      const sortedDayData = dayData ? sortScreenTimeDataForDate(dayData) : {}
      setDailyBreakdown(sortedDayData)
    }

    getData()
    const interval = setInterval(getData, 5000)
    return () => clearInterval(interval)
  }, [globalScreenTimeData, selectedDate])

  return (
    <div className="p-4 space-y-4">
      {Object.keys(globalScreenTimeData).length > 0 && (
        <ScreenTimeChart
          selectedDate={selectedDate}
          setSelectedDay={setSelectedDate}
        />
      )}
      <DailyScreenTimeBreakdown
        dailyBreakdown={dailyBreakdown}
        selectedDate={selectedDate}
      />
    </div>
  )
}
