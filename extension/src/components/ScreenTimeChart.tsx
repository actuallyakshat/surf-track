import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig
} from "@/components/ui/chart"
import { formatSeconds, getWeekNumber } from "@/lib/functions"
import type { DailyData, ScreenTimeData } from "@/types/types"
import {
  CircleChevronLeft,
  CircleChevronRight,
  TrendingDown,
  TrendingUp
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { useGlobalContext } from "../context/globalContext"

const chartConfig: ChartConfig = {
  screentime: {
    label: "Duration",
    color: "hsl(var(--chart-1))"
  }
}

const getStartOfWeekForYear = (weekNumber: number, year: number) => {
  // Get the first day of the year
  const jan1 = new Date(year, 0, 1)

  // Calculate the first Monday of the year
  const dayOfWeek = jan1.getDay() // 0 (Sunday) to 6 (Saturday)

  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Distance to Monday
  jan1.setDate(jan1.getDate() + (1 - distanceToMonday)) // Move to Monday of the first week

  // Calculate the start of the specified week
  const startOfWeek = new Date(jan1)
  startOfWeek.setDate(startOfWeek.getDate() + (weekNumber - 1) * 7)

  return startOfWeek
}

const convertToChartData = (data: ScreenTimeData, currentWeek: number) => {
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const year = new Date().getFullYear() // Use the current year or any specific year if needed

  // Calculate start of the week for the given week number
  const startOfWeek = getStartOfWeekForYear(currentWeek, year)

  // Retrieve data for the specified week
  const weekData = data[currentWeek] || {}

  // Generate chart data from weekData
  const chartData = daysOfWeek.map((day, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index) // Get date for each day of the week
    const dateKey = date.toISOString().split("T")[0]

    const dayData: DailyData = weekData[dateKey] || { domains: {} }
    const totalSeconds = Object.values(dayData).reduce(
      (sum, entry) => sum + entry.timeSpent,
      0
    )

    const screentime = totalSeconds / 60 // Convert seconds to minutes

    console.log(`Date: ${dateKey}, Total Seconds: ${totalSeconds}`)

    return {
      day,
      screentime, // Convert seconds to minutes
      dateKey
    }
  })

  return chartData
}
export function ScreenTimeChart({
  selectedDate,
  setSelectedDay
}: {
  selectedDate: string
  setSelectedDay: Function
}) {
  const [chartData, setChartData] = useState<
    { day: string; screentime: number; dateKey: string }[]
  >([])
  const [weekNumber, setWeekNumber] = useState<number>(
    getWeekNumber(new Date(selectedDate))
  )
  const { data: globalScreenTimeData } = useGlobalContext()

  useEffect(() => {
    console.log("Global screen time data:", globalScreenTimeData)
    const screenTimeData: ScreenTimeData = globalScreenTimeData || {}
    console.log("Screen time data:", screenTimeData)
    const dataForChart = convertToChartData(screenTimeData, weekNumber)
    console.log("Data for chart:", dataForChart)
    setChartData(dataForChart)
    getPercentageDifference()
  }, [weekNumber, globalScreenTimeData, selectedDate])

  function getPercentageDifference() {
    const currentWeek = getWeekNumber(new Date(selectedDate))
    const previousWeek = currentWeek - 1
    const previousWeekData = globalScreenTimeData[previousWeek] || {}
    const currentWeekData = globalScreenTimeData[currentWeek] || {}

    const previousTotalSeconds = Object.values(previousWeekData).reduce(
      (sum, dailyData) =>
        sum +
        Object.values(dailyData).reduce(
          (daySum, entry) => daySum + entry.timeSpent,
          0
        ),
      0
    )

    // Calculate total seconds for the current week
    const currentTotalSeconds = Object.values(currentWeekData).reduce(
      (sum, dailyData) =>
        sum +
        Object.values(dailyData).reduce(
          (daySum, entry) => daySum + entry.timeSpent,
          0
        ),
      0
    )

    const percentageDifference =
      ((currentTotalSeconds - previousTotalSeconds) / previousTotalSeconds) *
      100

    if (previousTotalSeconds === 0) {
      return "No screen time recorded for the previous week."
    }

    if (percentageDifference > 0) {
      return (
        <div className="flex items-center gap-2">
          <span>
            Your screen time was up by {percentageDifference.toFixed(2)}% this
            week
          </span>
          <TrendingUp className="h-4 w-4" />
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2">
          <span>
            Your screen time was down by{" "}
            {Math.abs(percentageDifference).toFixed(2)}% this week
          </span>
          <TrendingDown className="h-4 w-4" />
        </div>
      )
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between w-full px-5 pt-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold">Your Weekly Activity</h1>
          <p className="text-muted-foreground text-sm">
            Summary of your daily surf activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button>
            <CircleChevronLeft
              className="size-5"
              onClick={() => {
                setWeekNumber(weekNumber - 1)
              }}
            />
          </button>
          <button disabled={weekNumber >= getWeekNumber(new Date())}>
            <CircleChevronRight
              className="size-5"
              onClick={() => {
                if (weekNumber < getWeekNumber(new Date())) {
                  setWeekNumber(weekNumber + 1)
                }
              }}
            />
          </button>
        </div>
      </div>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={({ payload }) => {
                if (payload && payload.length > 0) {
                  const { value } = payload[0]
                  console.log(
                    `Tooltip content value: ${(value as number) * 60}`
                  )
                  return (
                    <span className="py-1 px-4 rounded-lg border shadow-md bg-background">
                      Duration: {formatSeconds((value as number) * 60)}
                    </span>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="screentime"
              fill="hsl(var(--chart-1))"
              radius={8}
              className="cursor-pointer"
              onClick={(e) => {
                setSelectedDay(e.payload.dateKey)
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {getPercentageDifference()}
        </div>
      </CardFooter>
    </Card>
  )
}
