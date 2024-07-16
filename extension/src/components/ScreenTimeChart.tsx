import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig
} from "@/components/ui/chart"
import { formatSeconds, sortScreenTimeData } from "@/lib/functions"
import type { ScreenTimeData } from "@/types/types"
import { TrendingUp } from "lucide-react"
import React, { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

// Define the chart configuration
const chartConfig: ChartConfig = {
  screentime: {
    label: "Duration",
    color: "hsl(var(--chart-1))"
  }
}

// Convert screen time object to chart data format for the week
const convertToChartData = (data: ScreenTimeData) => {
  // Days of the week as abbreviated names
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  // Get the current date and current day index (0 for Sunday, 6 for Saturday)
  const today = new Date()
  const currentDayIndex = today.getDay() // 0 (Sunday) to 6 (Saturday)

  // Calculate the start of the week (Monday)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - ((currentDayIndex + 6) % 7)) // Adjust to Monday

  // Generate the chart data for the week
  const chartData = daysOfWeek.map((day, index) => {
    const dayOffset = index // Day offset from the start of the week
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + dayOffset)
    const dateKey = date.toISOString().split("T")[0]

    // Aggregate timeSpent for the given day
    const dayData = data[dateKey] || {}
    const totalSeconds = Object.values(dayData).reduce(
      (sum, site) => sum + site.timeSpent,
      0
    )
    return {
      day, // Use abbreviated day of the week as the key for the chart
      screentime: totalSeconds / 60 // Convert seconds to minutes
    }
  })

  return chartData
}

export function ScreenTimeChart() {
  const [chartData, setChartData] = useState<
    { day: string; screentime: number }[]
  >([])

  useEffect(() => {
    chrome.storage.local.get(["screenTimeData"], (result) => {
      const screenTimeData: ScreenTimeData = result.screenTimeData || {}
      console.log("ScreenTimeData:", screenTimeData)

      // Process and sort data
      const sortedScreenTimeData = sortScreenTimeData(screenTimeData)

      // Convert to chart data for the week
      const dataForChart = convertToChartData(sortedScreenTimeData)
      setChartData(dataForChart)
    })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Weekly Activity</CardTitle>
        <CardDescription>
          Your daily surf activity of the current week
        </CardDescription>
      </CardHeader>
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
                  return (
                    <span className="py-1 px-4 rounded-lg border shadow-md bg-background">
                      Duration: {formatSeconds((value as number) * 60)}
                    </span>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="screentime" fill="hsl(var(--chart-1))" radius={8}>
              {/* No LabelList to hide numbers on top of bars */}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Your screen time was up by 27% this week
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          You averaged 6 hours of screen time per day
        </div>
      </CardFooter>
    </Card>
  )
}
