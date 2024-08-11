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
  const [averageScreenTime, setAverageScreenTime] = useState<string>("")

  useEffect(() => {
    const screenTimeData: ScreenTimeData = globalScreenTimeData || {}
    const dataForChart = convertToChartData(screenTimeData, weekNumber)
    setChartData(dataForChart)
    // getPercentageDifference()
    getAverageScreenTimeForWeek(globalScreenTimeData, weekNumber)
  }, [weekNumber, globalScreenTimeData, selectedDate])

  // function getPercentageDifference() {
  //   const currentWeek = getWeekNumber(new Date(selectedDate))
  //   const previousWeek = currentWeek - 1
  //   const previousWeekData = globalScreenTimeData[previousWeek] || {}
  //   const currentWeekData = globalScreenTimeData[currentWeek] || {}

  //   const previousTotalSeconds = Object.values(previousWeekData).reduce(
  //     (sum, dailyData) =>
  //       sum +
  //       Object.values(dailyData).reduce(
  //         (daySum, entry) => daySum + entry.timeSpent,
  //         0
  //       ),
  //     0
  //   )

  //   // Calculate total seconds for the current week
  //   const currentTotalSeconds = Object.values(currentWeekData).reduce(
  //     (sum, dailyData) =>
  //       sum +
  //       Object.values(dailyData).reduce(
  //         (daySum, entry) => daySum + entry.timeSpent,
  //         0
  //       ),
  //     0
  //   )

  //   const percentageDifference =
  //     ((currentTotalSeconds - previousTotalSeconds) / previousTotalSeconds) *
  //     100

  //   if (previousTotalSeconds === 0) {
  //     return "No screen time recorded for the previous week."
  //   }

  //   if (percentageDifference > 0) {
  //     return (
  //       <div className="flex items-center gap-2">
  //         <span>
  //           Your screen time is up by {percentageDifference.toFixed(2)}% this
  //           week
  //         </span>
  //         <TrendingUp className="h-4 w-4" />
  //       </div>
  //     )
  //   } else {
  //     return (
  //       <div className="flex items-center gap-2">
  //         <span>
  //           Your screen time is down by{" "}
  //           {Math.abs(percentageDifference).toFixed(2)}% this week
  //         </span>
  //         <TrendingDown className="h-4 w-4" />
  //       </div>
  //     )
  //   }
  // }

  function getAverageScreenTimeForWeek(
    globalScreenTimeData: ScreenTimeData,
    weekNumber: number
  ) {
    const currentWeek = getWeekNumber(new Date())
    const currentYear = new Date().getFullYear()
    const weekData = globalScreenTimeData[weekNumber] || {}

    // Get the number of days with data in the given week
    const daysWithData = Object.keys(weekData)

    if (daysWithData.length === 0) {
      setAverageScreenTime("")
      return
    }

    // Calculate the total screen time for the given week
    const totalSeconds = daysWithData.reduce((sum, dateKey) => {
      const dailyData = weekData[dateKey]

      // Add the time spent on each website for the day
      return (
        sum +
        Object.values(dailyData).reduce((daySum, entry) => {
          return daySum + entry.timeSpent
        }, 0)
      )
    }, 0)

    // Calculate the average screen time in seconds
    const averageSeconds = totalSeconds / daysWithData.length

    // Convert average seconds to hours and minutes
    const hours = Math.floor(averageSeconds / 3600)
    const minutes = Math.floor((averageSeconds % 3600) / 60)

    if (currentWeek !== weekNumber) {
      setAverageScreenTime(
        `You averaged ${hours}h ${minutes}m in week ${weekNumber} of year ${currentYear}`
      )
    } else {
      if (hours === 0) {
        setAverageScreenTime(`You have averaged ${minutes}m upto now this week`)
      } else {
        setAverageScreenTime(
          `You have averaged ${hours}h ${minutes}m upto now this week`
        )
      }
    }
  }

  function previousWeekExists() {
    const previousWeekNumber = weekNumber - 1
    const hasPreviousWeekData = !!globalScreenTimeData[previousWeekNumber]
    return hasPreviousWeekData
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
          <button
            className="disabled:cursor-not-allowed"
            disabled={!previousWeekExists()}
            onClick={() => {
              const hasPreviousWeekData = previousWeekExists()

              if (hasPreviousWeekData) {
                setWeekNumber(weekNumber - 1)
              } else {
                console.log("No data available for the previous week")
              }
            }}>
            <CircleChevronLeft className="size-5" />
          </button>
          <button
            className="disabled:cursor-not-allowed"
            disabled={weekNumber >= getWeekNumber(new Date())}
            onClick={() => {
              if (weekNumber < getWeekNumber(new Date())) {
                setWeekNumber(weekNumber + 1)
              }
            }}>
            <CircleChevronRight className="size-5" />
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
                  console.log("payload:", value)
                  if (isNaN(value as number) || value === undefined) return null // Check for NaN or undefined
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
        {averageScreenTime && (
          <div className="flex gap-2 font-medium leading-none">
            {/* {getPercentageDifference()} */}
            {averageScreenTime}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
