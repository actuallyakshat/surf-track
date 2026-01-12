import { CircleChevronLeft, CircleChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from "recharts"

import { Card, CardContent, CardFooter } from "~/components/ui/card"
import { aggregateWeekData } from "~/lib/data-transformations"
import {
  formatDateShort,
  formatSeconds,
  getLocalDateKey,
  getYearWeek
} from "~/lib/time-utils"
import type { ScreenTimeData } from "~/types"

interface ScreenTimeChartProps {
  selectedDate: string // ISO date (YYYY-MM-DD)
  screenTimeData: ScreenTimeData
  onDateSelect: (date: string) => void
  onNavigateWeek: (direction: "prev" | "next") => void
}

interface ChartDataPoint {
  date: string // ISO format YYYY-MM-DD
  displayDate: string // Short format (e.g., "Mon")
  time: number // Seconds
}

export function ScreenTimeChart({
  selectedDate,
  screenTimeData,
  onDateSelect,
  onNavigateWeek
}: ScreenTimeChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Transform data for the chart (memoized for performance)
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const selectedDateObj = new Date(selectedDate + "T00:00:00")
    const dayOfWeek = selectedDateObj.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(selectedDateObj)
    monday.setDate(selectedDateObj.getDate() + mondayOffset)

    const weekDates: ChartDataPoint[] = []
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      // Use local date key to avoid timezone shifts (e.g. UTC-1 shift)
      const dateStr = getLocalDateKey(date)

      // Get year-week for each date to fetch data accurately
      const yearWeek = getYearWeek(date)
      const dayData = screenTimeData[yearWeek]?.[dateStr] || {}
      const totalSeconds = Object.values(dayData).reduce(
        (sum, entry) => sum + (entry?.time || 0),
        0
      )

      weekDates.push({
        date: dateStr,
        displayDate: days[i],
        time: Math.round(totalSeconds / 60) // v1 uses minutes for chart
      })
    }

    return weekDates
  }, [selectedDate, screenTimeData])

  // Calculate average for footer (mimicking v1)
  const averageText = useMemo(() => {
    const activeDays = chartData.filter((d) => d.time > 0)
    if (activeDays.length === 0) return ""

    const avgMinutes =
      activeDays.reduce((sum, d) => sum + d.time, 0) / activeDays.length
    const hours = Math.floor(avgMinutes / 60)
    const minutes = Math.floor(avgMinutes % 60)

    return `You averaged ${hours}h ${minutes}m this week`
  }, [chartData])

  return (
    <Card>
      <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-w-full plasmo-px-5 plasmo-pt-4 plasmo-pb-2">
        <div>
          <h1 className="plasmo-text-2xl plasmo-font-bold">
            Your Weekly Activity
          </h1>
          <p className="plasmo-text-muted-foreground plasmo-text-sm">
            Summary of your daily surf activity
          </p>
        </div>
        <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
          <button
            className="plasmo-disabled:plasmo-opacity-50"
            onClick={() => onNavigateWeek("prev")}>
            <CircleChevronLeft className="plasmo-size-5" />
          </button>
          <button
            className="plasmo-disabled:plasmo-opacity-50"
            onClick={() => onNavigateWeek("next")}>
            <CircleChevronRight className="plasmo-size-5" />
          </button>
        </div>
      </div>

      <CardContent>
        <div className="plasmo-h-[250px] plasmo-w-full">
          {isMounted ? (
            <ResponsiveContainer
              width="100%"
              height={250}
              minWidth={0}
              debounce={1}>
              <BarChart data={chartData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  cursor={false}
                  content={({ payload }) => {
                    if (payload?.[0]?.value) {
                      return (
                        <span className="plasmo-py-1 plasmo-px-4 plasmo-rounded-lg plasmo-border plasmo-shadow-md plasmo-bg-background plasmo-text-sm">
                          Duration:{" "}
                          {formatSeconds((payload[0].value as number) * 60)}
                        </span>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="time"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                  className="plasmo-cursor-pointer"
                  onClick={(e) => {
                    if (e?.payload?.date) onDateSelect(e.payload.date)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="plasmo-h-[250px] plasmo-w-full" />
          )}
        </div>
      </CardContent>

      {averageText && (
        <CardFooter className="plasmo-flex-col plasmo-items-start plasmo-gap-2 plasmo-text-sm plasmo-pb-4">
          <div className="plasmo-flex plasmo-gap-2 plasmo-font-medium plasmo-leading-none">
            {averageText}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
