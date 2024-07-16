import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig
} from "@/components/ui/chart"
import {
  formatSeconds,
  getWeekNumber,
  sortScreenTimeData
} from "@/lib/functions"
import type { ScreenTimeData } from "@/types/types"
import { CircleChevronLeft, CircleChevronRight, TrendingUp } from "lucide-react"
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
  console.log(
    `Calculating start of week for weekNumber=${weekNumber} and year=${year}`
  )

  // Get the first day of the year
  const jan1 = new Date(year, 0, 1)
  console.log(`Initial date (Jan 1st): ${jan1}`)

  // Calculate the first Monday of the year
  const dayOfWeek = jan1.getDay() // 0 (Sunday) to 6 (Saturday)
  console.log(`Day of the week for Jan 1st: ${dayOfWeek}`)

  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Distance to Monday
  jan1.setDate(jan1.getDate() + (1 - distanceToMonday)) // Move to Monday of the first week
  console.log(`Adjusted date to first Monday: ${jan1}`)

  // Calculate the start of the specified week
  const startOfWeek = new Date(jan1)
  startOfWeek.setDate(startOfWeek.getDate() + (weekNumber - 1) * 7)
  console.log(`Start of the specified week: ${startOfWeek}`)

  return startOfWeek
}

const convertToChartData = (data: ScreenTimeData, currentWeek: number) => {
  console.log(`Converting data to chart format for weekNumber=${currentWeek}`)

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const year = new Date().getFullYear() // Use the current year or any specific year if needed
  console.log(`Current year: ${year}`)

  // Calculate start of the week for the given week number
  const startOfWeek = getStartOfWeekForYear(currentWeek, year)
  console.log("Start of week:", startOfWeek)

  // Retrieve data for the specified week
  const weekData = data[currentWeek] || {}
  console.log("Week data:", weekData)

  // Generate chart data from weekData
  const chartData = daysOfWeek.map((day, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index) // Get date for each day of the week
    const dateKey = date.toISOString().split("T")[0]

    const dayData = weekData[dateKey] || {}
    const totalSeconds = Object.values(dayData).reduce(
      (sum, entry) => sum + entry.timeSpent,
      0
    )

    console.log(`Date: ${dateKey}, Total Seconds: ${totalSeconds}`)

    return {
      day,
      screentime: totalSeconds / 60, // Convert seconds to minutes
      dateKey
    }
  })

  console.log("Chart data:", chartData)

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
    console.log(`Selected date: ${selectedDate}`)
    console.log(`Week number: ${weekNumber}`)

    const screenTimeData: ScreenTimeData = globalScreenTimeData || {}
    console.log("Global screen time data:", screenTimeData)

    const dataForChart = convertToChartData(screenTimeData, weekNumber)
    setChartData(dataForChart)
    console.log("Chart data set:", dataForChart)
  }, [weekNumber, globalScreenTimeData, selectedDate])

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
                console.log("Previous week button clicked")
                setWeekNumber(weekNumber - 1)
              }}
            />
          </button>
          <button disabled={weekNumber >= getWeekNumber(new Date())}>
            <CircleChevronRight
              className="size-5"
              onClick={() => {
                if (weekNumber < getWeekNumber(new Date())) {
                  console.log("Next week button clicked")
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
              onClick={(e) => {
                console.log(`Bar clicked for dateKey: ${e.payload.dateKey}`)
                setSelectedDay(e.payload.dateKey)
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Your screen time was up by 27% this week
          <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  )
}
