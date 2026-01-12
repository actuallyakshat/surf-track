import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  formatDateHeader,
  formatDateShort,
  formatSeconds,
  getTodayDate,
  getWeekDates,
  getYearWeek
} from "./time-utils"

describe("time-utils", () => {
  describe("formatSeconds", () => {
    it("formats seconds less than a minute", () => {
      expect(formatSeconds(45)).toBe("45s")
      expect(formatSeconds(0)).toBe("0s")
      expect(formatSeconds(59.9)).toBe("59s")
    })

    it("formats minutes", () => {
      expect(formatSeconds(60)).toBe("1m")
      expect(formatSeconds(125)).toBe("2m") // 2m 5s -> just shows minutes if < 1h? Code says: minutes + 'm'
    })

    it("formats hours and minutes", () => {
      expect(formatSeconds(3600)).toBe("1h 0m")
      expect(formatSeconds(3665)).toBe("1h 1m")
      expect(formatSeconds(7300)).toBe("2h 1m")
    })
  })

  describe("getYearWeek", () => {
    it("calculates the correct year and week for a given date", () => {
      // 2026-01-04 is a Sunday.
      // In 2026, Jan 1 is Thursday.
      // ISO Week 1 of 2026 is Mon Dec 29 2025 - Sun Jan 4 2026.
      // So 2026-01-04 is indeed 2026_01.

      const date1 = new Date("2026-01-04T12:00:00Z")
      expect(getYearWeek(date1)).toBe("2026_01")

      // Let's rely on a known stable date.
      // 2024-01-10 (Wednesday) -> 2024_02
      expect(getYearWeek(new Date("2024-01-10T12:00:00Z"))).toBe("2024_02")
    })

    it("handles year boundary correctly (start of year)", () => {
      // Jan 1st 2024 is a Monday. It should be 2024_01
      expect(getYearWeek(new Date("2024-01-01T12:00:00Z"))).toBe("2024_01")
    })

    it("uses current date if no argument provided", () => {
      const mockDate = new Date("2023-05-15T12:00:00Z")
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)

      expect(getYearWeek()).toBe("2023_20")

      vi.useRealTimers()
    })
  })

  describe("getTodayDate", () => {
    it("returns today date in YYYY-MM-DD format", () => {
      const mockDate = new Date("2023-10-05T12:00:00") // Local time consideration might apply
      // The function uses .getFullYear(), .getMonth(), .getDate() which are local time.
      // Ideally we should mock the timezone too or just check the format logic.

      vi.useFakeTimers()
      vi.setSystemTime(mockDate)

      // Note: This test might be flaky if run in different timezones
      // because new Date() uses system local time.
      // However, vi.setSystemTime sets the "now".
      // But getFullYear() depends on the timezone offset.
      // We will assume the test runner environment is stable or we verify logic.

      const result = getTodayDate()
      // We expect it to match the components of the mocked date.
      const y = mockDate.getFullYear()
      const m = String(mockDate.getMonth() + 1).padStart(2, "0")
      const d = String(mockDate.getDate()).padStart(2, "0")

      expect(result).toBe(`${y}-${m}-${d}`)

      vi.useRealTimers()
    })
  })

  describe("formatDateShort", () => {
    it('formats YYYY-MM-DD to "Mon 4"', () => {
      // 2024-03-04 is a Monday
      expect(formatDateShort("2024-03-04")).toMatch(/Mon 4/)
    })
  })

  describe("formatDateHeader", () => {
    it('formats YYYY-MM-DD to "Monday, Mar 4"', () => {
      expect(formatDateHeader("2024-03-04")).toMatch(/Monday, Mar 4/)
    })
  })

  describe("getWeekDates", () => {
    it("returns 7 days for a given week", () => {
      const dates = getWeekDates("2024_02") // Week 2 of 2024.
      // Week 1 started Jan 1 (Mon). Week 2 starts Jan 8 (Mon).

      expect(dates).toHaveLength(7)
      expect(dates[0]).toBe("2024-01-08")
      expect(dates[6]).toBe("2024-01-14")
    })

    it("handles weeks crossing months", () => {
      // 2024-01-29 (Mon) is start of Week 5.
      // It goes to Feb 4.
      const dates = getWeekDates("2024_05")
      expect(dates[0]).toBe("2024-01-29")
      expect(dates[3]).toBe("2024-02-01") // Thursday
      expect(dates[6]).toBe("2024-02-04")
    })

    it("handles weeks crossing years", () => {
      // Week 1 of 2025.
      // Jan 1 2025 is Wednesday.
      // Week 1 starts Dec 30, 2024.
      const dates = getWeekDates("2025_01")
      expect(dates[0]).toBe("2024-12-30")
      expect(dates[2]).toBe("2025-01-01")
    })
  })
})
