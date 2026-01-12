import { describe, expect, it } from "vitest"

import { aggregateWeekData } from "~/lib/data-transformations"
import { formatDateShort, getYearWeek } from "~/lib/time-utils"
import type { ScreenTimeData } from "~/types"

describe("ScreenTimeChart data transformation", () => {
  it("should correctly aggregate week data for chart", () => {
    const testData: ScreenTimeData = {
      "2026_01": {
        "2026-01-04": {
          "example.com": { time: 3600 },
          "test.com": { time: 1800 }
        },
        "2026-01-05": {
          "example.com": { time: 2400 }
        }
      }
    }

    const aggregated = aggregateWeekData(testData, "2026_01")

    expect(aggregated["2026-01-04"]).toBe(5400) // 3600 + 1800
    expect(aggregated["2026-01-05"]).toBe(2400)
    expect(aggregated["2026-01-06"]).toBeUndefined() // No data for this date
  })

  it("should format dates correctly for display", () => {
    const date1 = formatDateShort("2026-01-04")
    const date2 = formatDateShort("2026-01-05")

    // These should be short weekday + day format
    expect(date1).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2}$/)
    expect(date2).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2}$/)
  })

  it("should calculate correct year-week", () => {
    const date = new Date("2026-01-04T00:00:00")
    const yearWeek = getYearWeek(date)

    expect(yearWeek).toBe("2026_01") // First week of 2026
  })

  it("should handle empty data gracefully", () => {
    const emptyData: ScreenTimeData = {}
    const aggregated = aggregateWeekData(emptyData, "2026_01")

    expect(aggregated).toEqual({})
  })

  it("should calculate Monday correctly from any day of week", () => {
    // Test with Sunday (2026-01-04 is a Saturday)
    const saturday = new Date("2026-01-04T00:00:00")
    const dayOfWeek = saturday.getDay() // 6 (Saturday)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(saturday)
    monday.setDate(saturday.getDate() + mondayOffset)

    // Monday should be 2025-12-29 (previous week's Monday)
    expect(monday.getDay()).toBe(1) // Monday is 1
  })
})
