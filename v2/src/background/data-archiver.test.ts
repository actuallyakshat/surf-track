import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ArchivedScreenTimeData, ScreenTimeData } from "../types"
import { DataArchiver } from "./data-archiver"

const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  }
}

global.chrome = mockChrome as any

describe("DataArchiver", () => {
  let archiver: DataArchiver

  beforeEach(() => {
    vi.clearAllMocks()
    archiver = DataArchiver.getInstance()
    ;(archiver as any).isRunning = false
  })

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = DataArchiver.getInstance()
      const instance2 = DataArchiver.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("start() and stop()", () => {
    it("should schedule archiving alarm on start", () => {
      archiver.start()
      expect(mockChrome.alarms.create).toHaveBeenCalledWith(
        "archive_data_alarm",
        {
          delayInMinutes: 1,
          periodInMinutes: 24 * 60
        }
      )
    })

    it("should setup alarm listener on start", () => {
      archiver.start()
      expect(mockChrome.alarms.onAlarm.addListener).toHaveBeenCalled()
    })

    it("should not schedule twice if already running", () => {
      archiver.start()
      archiver.start()
      expect(mockChrome.alarms.create).toHaveBeenCalledTimes(1)
    })

    it("should clear alarm on stop", () => {
      archiver.stop()
      expect(mockChrome.alarms.clear).toHaveBeenCalledWith("archive_data_alarm")
    })
  })

  describe("calculateCutoffDate()", () => {
    it("should calculate cutoff date as 90 days ago", () => {
      const today = new Date("2026-01-04")
      vi.useFakeTimers()
      vi.setSystemTime(today)

      const expected = "2025-10-06"
      const result = (archiver as any).calculateCutoffDate()

      expect(result).toBe(expected)

      vi.useRealTimers()
    })
  })

  describe("extractOldData()", () => {
    it("should extract data older than cutoff date", () => {
      const screenTimeData: ScreenTimeData = {
        "2025_40": {
          "2025-10-01": { "example.com": { time: 100 } },
          "2025-10-05": { "test.com": { time: 200 } }
        },
        "2025_41": {
          "2025-10-10": { "new.com": { time: 300 } }
        }
      }

      const cutoffDate = "2025-10-06"
      const result = (archiver as any).extractOldData(
        screenTimeData,
        cutoffDate
      )

      expect(result).toEqual({
        "2025_40": {
          "2025-10-01": { "example.com": { time: 100 } },
          "2025-10-05": { "test.com": { time: 200 } }
        }
      })
    })

    it("should return empty object if no old data", () => {
      const screenTimeData: ScreenTimeData = {
        "2026_01": {
          "2026-01-01": { "example.com": { time: 100 } }
        }
      }

      const cutoffDate = "2025-10-06"
      const result = (archiver as any).extractOldData(
        screenTimeData,
        cutoffDate
      )

      expect(result).toEqual({})
    })

    it("should handle empty screenTimeData", () => {
      const screenTimeData: ScreenTimeData = {}
      const cutoffDate = "2025-10-06"
      const result = (archiver as any).extractOldData(
        screenTimeData,
        cutoffDate
      )

      expect(result).toEqual({})
    })
  })

  describe("removeOldData()", () => {
    it("should keep only data newer than cutoff", () => {
      const screenTimeData: ScreenTimeData = {
        "2025_40": {
          "2025-10-01": { "example.com": { time: 100 } },
          "2025-10-05": { "test.com": { time: 200 } }
        },
        "2025_41": {
          "2025-10-10": { "new.com": { time: 300 } }
        }
      }

      const cutoffDate = "2025-10-06"
      const result = (archiver as any).removeOldData(screenTimeData, cutoffDate)

      expect(result).toEqual({
        "2025_41": {
          "2025-10-10": { "new.com": { time: 300 } }
        }
      })
    })

    it("should remove week entries if all dates are old", () => {
      const screenTimeData: ScreenTimeData = {
        "2025_40": {
          "2025-10-01": { "example.com": { time: 100 } },
          "2025-10-05": { "test.com": { time: 200 } }
        }
      }

      const cutoffDate = "2025-10-06"
      const result = (archiver as any).removeOldData(screenTimeData, cutoffDate)

      expect(result).toEqual({})
    })

    it("should handle mixed weeks (some old, some new dates)", () => {
      const screenTimeData: ScreenTimeData = {
        "2025_40": {
          "2025-10-01": { "old.com": { time: 100 } },
          "2025-10-10": { "new.com": { time: 200 } }
        }
      }

      const cutoffDate = "2025-10-06"
      const result = (archiver as any).removeOldData(screenTimeData, cutoffDate)

      expect(result).toEqual({
        "2025_40": {
          "2025-10-10": { "new.com": { time: 200 } }
        }
      })
    })
  })

  describe("mergeIntoArchive()", () => {
    it("should merge old data into archive by year-month", () => {
      const archivedData: ArchivedScreenTimeData = {}
      const oldData: ScreenTimeData = {
        "2025_40": {
          "2025-10-01": { "example.com": { time: 100 } }
        }
      }

      const result = (archiver as any).mergeIntoArchive(archivedData, oldData)

      expect(result).toEqual({
        "2025-10": {
          "2025_40": {
            "2025-10-01": { "example.com": { time: 100 } }
          }
        }
      })
    })

    it("should merge into existing archive without overwriting", () => {
      const archivedData: ArchivedScreenTimeData = {
        "2025-09": {
          "2025_37": {
            "2025-09-15": { "old.com": { time: 50 } }
          }
        }
      }

      const oldData: ScreenTimeData = {
        "2025_40": {
          "2025-10-01": { "example.com": { time: 100 } }
        }
      }

      const result = (archiver as any).mergeIntoArchive(archivedData, oldData)

      expect(result).toEqual({
        "2025-09": {
          "2025_37": {
            "2025-09-15": { "old.com": { time: 50 } }
          }
        },
        "2025-10": {
          "2025_40": {
            "2025-10-01": { "example.com": { time: 100 } }
          }
        }
      })
    })

    it("should merge multiple dates in same year-month", () => {
      const archivedData: ArchivedScreenTimeData = {}
      const oldData: ScreenTimeData = {
        "2025_40": {
          "2025-10-01": { "example.com": { time: 100 } },
          "2025-10-05": { "test.com": { time: 200 } }
        }
      }

      const result = (archiver as any).mergeIntoArchive(archivedData, oldData)

      expect(result["2025-10"]["2025_40"]).toEqual({
        "2025-10-01": { "example.com": { time: 100 } },
        "2025-10-05": { "test.com": { time: 200 } }
      })
    })
  })

  describe("countEntries()", () => {
    it("should count total daily entries", () => {
      const data: ScreenTimeData = {
        "2025_40": {
          "2025-10-01": { "example.com": { time: 100 } },
          "2025-10-05": { "test.com": { time: 200 } }
        },
        "2025_41": {
          "2025-10-10": { "new.com": { time: 300 } }
        }
      }

      const result = (archiver as any).countEntries(data)
      expect(result).toBe(3)
    })

    it("should return 0 for empty data", () => {
      const data: ScreenTimeData = {}
      const result = (archiver as any).countEntries(data)
      expect(result).toBe(0)
    })
  })

  describe("archiveOldData()", () => {
    it("should archive old data and update storage", async () => {
      const screenTimeData: ScreenTimeData = {
        "2025_40": {
          "2025-10-01": { "old.com": { time: 100 } }
        },
        "2026_01": {
          "2026-01-01": { "new.com": { time: 200 } }
        }
      }

      mockChrome.storage.local.get.mockResolvedValue({
        screenTimeData,
        archivedData: {}
      })

      const today = new Date("2026-01-04")
      vi.useFakeTimers()
      vi.setSystemTime(today)

      const result = await archiver.archiveOldData()

      expect(result.archived).toBe(1)
      expect(result.errors).toEqual([])
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        screenTimeData: {
          "2026_01": {
            "2026-01-01": { "new.com": { time: 200 } }
          }
        },
        archivedData: {
          "2025-10": {
            "2025_40": {
              "2025-10-01": { "old.com": { time: 100 } }
            }
          }
        }
      })

      vi.useRealTimers()
    })

    it("should not update storage if no old data", async () => {
      const screenTimeData: ScreenTimeData = {
        "2026_01": {
          "2026-01-01": { "new.com": { time: 200 } }
        }
      }

      mockChrome.storage.local.get.mockResolvedValue({
        screenTimeData,
        archivedData: {}
      })

      const today = new Date("2026-01-04")
      vi.useFakeTimers()
      vi.setSystemTime(today)

      const result = await archiver.archiveOldData()

      expect(result.archived).toBe(0)
      expect(result.errors).toEqual([])
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it("should handle storage errors gracefully", async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error("Storage error"))

      const result = await archiver.archiveOldData()

      expect(result.archived).toBe(0)
      expect(result.errors).toEqual(["Storage error"])
    })

    it("should handle empty storage", async () => {
      mockChrome.storage.local.get.mockResolvedValue({})

      const result = await archiver.archiveOldData()

      expect(result.archived).toBe(0)
      expect(result.errors).toEqual([])
    })
  })

  describe("getArchivedData()", () => {
    it("should retrieve archived data from storage", async () => {
      const archivedData: ArchivedScreenTimeData = {
        "2025-10": {
          "2025_40": {
            "2025-10-01": { "old.com": { time: 100 } }
          }
        }
      }

      mockChrome.storage.local.get.mockResolvedValue({ archivedData })

      const result = await archiver.getArchivedData()

      expect(result).toEqual(archivedData)
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith("archivedData")
    })

    it("should return empty object if no archived data", async () => {
      mockChrome.storage.local.get.mockResolvedValue({})

      const result = await archiver.getArchivedData()

      expect(result).toEqual({})
    })
  })

  describe("Edge Cases", () => {
    it("should handle data exactly at cutoff date (not archived)", async () => {
      const today = new Date("2026-01-04")
      vi.useFakeTimers()
      vi.setSystemTime(today)

      const cutoffDate = "2025-10-06"
      const screenTimeData: ScreenTimeData = {
        "2025_40": {
          [cutoffDate]: { "boundary.com": { time: 100 } }
        }
      }

      mockChrome.storage.local.get.mockResolvedValue({
        screenTimeData,
        archivedData: {}
      })

      const result = await archiver.archiveOldData()

      expect(result.archived).toBe(0)
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it("should handle data one day before cutoff (archived)", async () => {
      const today = new Date("2026-01-04")
      vi.useFakeTimers()
      vi.setSystemTime(today)

      const screenTimeData: ScreenTimeData = {
        "2025_40": {
          "2025-10-05": { "old.com": { time: 100 } }
        }
      }

      mockChrome.storage.local.get.mockResolvedValue({
        screenTimeData,
        archivedData: {}
      })

      const result = await archiver.archiveOldData()

      expect(result.archived).toBe(1)

      vi.useRealTimers()
    })

    it("should handle large dataset with multiple weeks and dates", async () => {
      const today = new Date("2026-01-04")
      vi.useFakeTimers()
      vi.setSystemTime(today)

      const screenTimeData: ScreenTimeData = {
        "2025_35": {
          "2025-08-25": { "very-old.com": { time: 50 } }
        },
        "2025_40": {
          "2025-10-01": { "old.com": { time: 100 } },
          "2025-10-02": { "old2.com": { time: 150 } }
        },
        "2026_01": {
          "2026-01-01": { "new.com": { time: 200 } },
          "2026-01-02": { "new2.com": { time: 250 } }
        }
      }

      mockChrome.storage.local.get.mockResolvedValue({
        screenTimeData,
        archivedData: {}
      })

      const result = await archiver.archiveOldData()

      expect(result.archived).toBe(3)
      expect(result.errors).toEqual([])

      vi.useRealTimers()
    })
  })
})
