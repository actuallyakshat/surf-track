import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ScreenTimeData, TrackingState } from "../types"
import { StorageManager } from "./storage-manager"

const mockChromeStorage = {
  session: {
    get: vi.fn(),
    set: vi.fn()
  },
  local: {
    get: vi.fn(),
    set: vi.fn()
  }
}

vi.stubGlobal("chrome", {
  storage: mockChromeStorage
})

describe("StorageManager", () => {
  let storageManager: StorageManager

  beforeEach(() => {
    storageManager = StorageManager.getInstance()
    vi.clearAllMocks()
  })

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = StorageManager.getInstance()
      const instance2 = StorageManager.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("Session State Operations", () => {
    describe("getTrackingState", () => {
      it("should return tracking state when it exists", async () => {
        const mockState: TrackingState = {
          currentUrl: "https://example.com",
          startTime: Date.now(),
          lastActiveTime: Date.now()
        }
        mockChromeStorage.session.get.mockResolvedValue({
          trackingState: mockState
        })

        const result = await storageManager.getTrackingState()

        expect(result).toEqual(mockState)
        expect(mockChromeStorage.session.get).toHaveBeenCalledWith(
          "trackingState"
        )
      })

      it("should return null when tracking state does not exist", async () => {
        mockChromeStorage.session.get.mockResolvedValue({})

        const result = await storageManager.getTrackingState()

        expect(result).toBeNull()
      })

      it("should return null on error", async () => {
        mockChromeStorage.session.get.mockRejectedValue(
          new Error("Storage error")
        )

        const result = await storageManager.getTrackingState()

        expect(result).toBeNull()
      })
    })

    describe("setTrackingState", () => {
      it("should set tracking state successfully", async () => {
        const state: TrackingState = {
          currentUrl: "https://example.com",
          startTime: Date.now(),
          lastActiveTime: Date.now()
        }
        mockChromeStorage.session.set.mockResolvedValue(undefined)

        await storageManager.setTrackingState(state)

        expect(mockChromeStorage.session.set).toHaveBeenCalledWith({
          trackingState: state
        })
      })

      it("should throw error on failure", async () => {
        const state: TrackingState = {
          currentUrl: "https://example.com",
          startTime: Date.now(),
          lastActiveTime: Date.now()
        }
        mockChromeStorage.session.set.mockRejectedValue(
          new Error("Storage error")
        )

        await expect(storageManager.setTrackingState(state)).rejects.toThrow()
      })
    })

    describe("updateTrackingState", () => {
      it("should update partial tracking state", async () => {
        const existingState: TrackingState = {
          currentUrl: "https://example.com",
          startTime: 1000,
          lastActiveTime: 2000
        }
        mockChromeStorage.session.get.mockResolvedValue({
          trackingState: existingState
        })
        mockChromeStorage.session.set.mockResolvedValue(undefined)

        await storageManager.updateTrackingState({
          currentUrl: "https://new.com"
        })

        expect(mockChromeStorage.session.set).toHaveBeenCalledWith({
          trackingState: {
            currentUrl: "https://new.com",
            startTime: 1000,
            lastActiveTime: 2000,
            isIdle: false,
            favicon: null
          }
        })
      })

      it("should handle null existing state", async () => {
        mockChromeStorage.session.get.mockResolvedValue({})
        mockChromeStorage.session.set.mockResolvedValue(undefined)

        await storageManager.updateTrackingState({
          currentUrl: "https://new.com"
        })

        expect(mockChromeStorage.session.set).toHaveBeenCalledWith({
          trackingState: {
            currentUrl: "https://new.com",
            startTime: null,
            lastActiveTime: null,
            isIdle: false,
            favicon: null
          }
        })
      })
    })
  })

  describe("Screen Time Data Operations", () => {
    describe("getScreenTimeData", () => {
      it("should return screen time data when it exists", async () => {
        const mockData: ScreenTimeData = {
          "2026_01": {
            "2026-01-04": {
              "example.com": { time: 100, favicon: "icon.png" }
            }
          }
        }
        mockChromeStorage.local.get.mockResolvedValue({
          screenTimeData: mockData
        })

        const result = await storageManager.getScreenTimeData()

        expect(result).toEqual(mockData)
      })

      it("should return empty object when no data exists", async () => {
        mockChromeStorage.local.get.mockResolvedValue({})

        const result = await storageManager.getScreenTimeData()

        expect(result).toEqual({})
      })

      it("should return empty object on error", async () => {
        mockChromeStorage.local.get.mockRejectedValue(
          new Error("Storage error")
        )

        const result = await storageManager.getScreenTimeData()

        expect(result).toEqual({})
      })
    })

    describe("addTimeToCurrentDay", () => {
      it("should add time for new domain", async () => {
        mockChromeStorage.local.get.mockResolvedValue({ screenTimeData: {} })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addTimeToCurrentDay("example.com", 30, "icon.png")

        expect(mockChromeStorage.local.set).toHaveBeenCalled()
        const setCall = mockChromeStorage.local.set.mock.calls[0][0]
        const yearWeek = Object.keys(setCall.screenTimeData)[0]
        const dateKey = Object.keys(setCall.screenTimeData[yearWeek])[0]

        expect(
          setCall.screenTimeData[yearWeek][dateKey]["example.com"]
        ).toEqual({
          time: 30,
          favicon: "icon.png"
        })
      })

      it("should add time to existing domain", async () => {
        const now = new Date()
        const yearWeek = "2026_01"
        const dateKey = "2026-01-04"

        const existingData: ScreenTimeData = {
          [yearWeek]: {
            [dateKey]: {
              "example.com": { time: 50, favicon: "icon.png" }
            }
          }
        }

        mockChromeStorage.local.get.mockResolvedValue({
          screenTimeData: existingData
        })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addTimeToCurrentDay("example.com", 30)

        const setCall = mockChromeStorage.local.set.mock.calls[0][0]
        expect(
          setCall.screenTimeData[yearWeek][dateKey]["example.com"].time
        ).toBeGreaterThanOrEqual(50)
      })

      it("should preserve existing favicon if new one not provided", async () => {
        const yearWeek = "2026_01"
        const dateKey = "2026-01-04"

        const existingData: ScreenTimeData = {
          [yearWeek]: {
            [dateKey]: {
              "example.com": { time: 50, favicon: "old-icon.png" }
            }
          }
        }

        mockChromeStorage.local.get.mockResolvedValue({
          screenTimeData: existingData
        })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addTimeToCurrentDay("example.com", 30)

        const setCall = mockChromeStorage.local.set.mock.calls[0][0]
        expect(
          setCall.screenTimeData[yearWeek][dateKey]["example.com"].favicon
        ).toBe("old-icon.png")
      })
    })

    describe("updateFavicon", () => {
      it("should update favicon for domain without one", async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-01-04T12:00:00Z"))

        const yearWeek = "2026_01"
        const dateKey = "2026-01-04"

        const existingData: ScreenTimeData = {
          [yearWeek]: {
            [dateKey]: {
              "example.com": { time: 50 }
            }
          }
        }

        mockChromeStorage.local.get.mockResolvedValue({
          screenTimeData: existingData
        })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.updateFavicon("example.com", "new-icon.png")

        const setCall = mockChromeStorage.local.set.mock.calls[0][0]
        expect(
          setCall.screenTimeData[yearWeek][dateKey]["example.com"].favicon
        ).toBe("new-icon.png")
        vi.useRealTimers()
      })

      it("should not overwrite existing favicon", async () => {
        const yearWeek = "2026_01"
        const dateKey = "2026-01-04"

        const existingData: ScreenTimeData = {
          [yearWeek]: {
            [dateKey]: {
              "example.com": { time: 50, favicon: "existing-icon.png" }
            }
          }
        }

        mockChromeStorage.local.get.mockResolvedValue({
          screenTimeData: existingData
        })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.updateFavicon("example.com", "new-icon.png")

        expect(mockChromeStorage.local.set).not.toHaveBeenCalled()
      })
    })
  })

  describe("Blocked Domains Operations", () => {
    describe("getBlockedDomains", () => {
      it("should return blocked domains when they exist", async () => {
        const blockedDomains = ["facebook.com", "twitter.com"]
        mockChromeStorage.local.get.mockResolvedValue({ blockedDomains })

        const result = await storageManager.getBlockedDomains()

        expect(result).toEqual(blockedDomains)
      })

      it("should return empty array when no blocked domains exist", async () => {
        mockChromeStorage.local.get.mockResolvedValue({})

        const result = await storageManager.getBlockedDomains()

        expect(result).toEqual([])
      })

      it("should return empty array on error", async () => {
        mockChromeStorage.local.get.mockRejectedValue(
          new Error("Storage error")
        )

        const result = await storageManager.getBlockedDomains()

        expect(result).toEqual([])
      })
    })

    describe("addBlockedDomain", () => {
      it("should add domain to blocked list", async () => {
        mockChromeStorage.local.get.mockResolvedValue({ blockedDomains: [] })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addBlockedDomain("example.com")

        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          blockedDomains: ["example.com"]
        })
      })

      it("should not add duplicate domain", async () => {
        const existing = ["example.com"]
        mockChromeStorage.local.get.mockResolvedValue({
          blockedDomains: existing
        })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addBlockedDomain("example.com")

        expect(mockChromeStorage.local.set).not.toHaveBeenCalled()
      })
    })

    describe("removeBlockedDomain", () => {
      it("should remove domain from blocked list", async () => {
        mockChromeStorage.local.get.mockResolvedValue({
          blockedDomains: ["example.com", "test.com"]
        })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.removeBlockedDomain("example.com")

        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          blockedDomains: ["test.com"]
        })
      })

      it("should handle removing non-existent domain", async () => {
        mockChromeStorage.local.get.mockResolvedValue({
          blockedDomains: ["test.com"]
        })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.removeBlockedDomain("example.com")

        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          blockedDomains: ["test.com"]
        })
      })
    })

    describe("isBlocked", () => {
      it("should return true for blocked domain", async () => {
        mockChromeStorage.local.get.mockResolvedValue({
          blockedDomains: ["example.com"]
        })

        const result = await storageManager.isBlocked("example.com")

        expect(result).toBe(true)
      })

      it("should return false for non-blocked domain", async () => {
        mockChromeStorage.local.get.mockResolvedValue({
          blockedDomains: ["other.com"]
        })

        const result = await storageManager.isBlocked("example.com")

        expect(result).toBe(false)
      })

      it("should return false on error", async () => {
        mockChromeStorage.local.get.mockRejectedValue(
          new Error("Storage error")
        )

        const result = await storageManager.isBlocked("example.com")

        expect(result).toBe(false)
      })
    })
  })

  describe("Archived Data Operations", () => {
    describe("getArchivedData", () => {
      it("should return archived data when it exists", async () => {
        const mockArchive = {
          "2025_12": {
            "2025_50": {
              "2025-12-15": {
                "example.com": { time: 100 }
              }
            }
          }
        }
        mockChromeStorage.local.get.mockResolvedValue({
          archivedData: mockArchive
        })

        const result = await storageManager.getArchivedData()

        expect(result).toEqual(mockArchive)
      })

      it("should return empty object when no archived data exists", async () => {
        mockChromeStorage.local.get.mockResolvedValue({})

        const result = await storageManager.getArchivedData()

        expect(result).toEqual({})
      })
    })

    describe("addToArchive", () => {
      it("should add new archived data", async () => {
        const existing = {
          "2025_11": {
            "2025_45": {
              "2025-11-10": {
                "old.com": { time: 50 }
              }
            }
          }
        }
        const newArchive = {
          "2025_12": {
            "2025_50": {
              "2025-12-15": {
                "new.com": { time: 100 }
              }
            }
          }
        }

        mockChromeStorage.local.get.mockResolvedValue({
          archivedData: existing
        })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addToArchive(newArchive)

        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          archivedData: { ...existing, ...newArchive }
        })
      })

      it("should merge with existing archived data", async () => {
        mockChromeStorage.local.get.mockResolvedValue({ archivedData: {} })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        const archive = {
          "2025_12": {
            "2025_50": {
              "2025-12-15": {
                "example.com": { time: 100 }
              }
            }
          }
        }

        await storageManager.addToArchive(archive)

        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          archivedData: archive
        })
      })
    })
  })

  describe("Error Handling & Edge Cases", () => {
    describe("storage failures", () => {
      it("should handle concurrent write failures gracefully", async () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {})
        mockChromeStorage.local.get.mockResolvedValue({ screenTimeData: {} })
        mockChromeStorage.local.set
          .mockRejectedValueOnce(new Error("First write failed"))
          .mockResolvedValueOnce(undefined)

        await expect(
          storageManager.addTimeToCurrentDay("test.com", 30)
        ).rejects.toThrow("First write failed")

        // Second call should succeed
        await expect(
          storageManager.addTimeToCurrentDay("test2.com", 30)
        ).resolves.not.toThrow()

        consoleSpy.mockRestore()
      })

      it("should handle storage quota exceeded error", async () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {})
        mockChromeStorage.local.get.mockResolvedValue({ blockedDomains: [] })
        mockChromeStorage.local.set.mockRejectedValue(
          new Error("QuotaExceededError")
        )

        await expect(
          storageManager.addBlockedDomain("example.com")
        ).rejects.toThrow("QuotaExceededError")

        consoleSpy.mockRestore()
      })
    })

    describe("data integrity", () => {
      it("should handle negative time values", async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-01-04T12:00:00Z"))

        mockChromeStorage.local.get.mockResolvedValue({ screenTimeData: {} })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addTimeToCurrentDay("test.com", -10)

        const setCall = mockChromeStorage.local.set.mock.calls[0][0]
        const yearWeek = Object.keys(setCall.screenTimeData)[0]
        const dateKey = Object.keys(setCall.screenTimeData[yearWeek])[0]

        expect(setCall.screenTimeData[yearWeek][dateKey]["test.com"].time).toBe(
          -10
        )

        vi.useRealTimers()
      })

      it("should handle zero time values", async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-01-04T12:00:00Z"))

        mockChromeStorage.local.get.mockResolvedValue({ screenTimeData: {} })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addTimeToCurrentDay("test.com", 0)

        const setCall = mockChromeStorage.local.set.mock.calls[0][0]
        const yearWeek = Object.keys(setCall.screenTimeData)[0]
        const dateKey = Object.keys(setCall.screenTimeData[yearWeek])[0]

        expect(setCall.screenTimeData[yearWeek][dateKey]["test.com"].time).toBe(
          0
        )

        vi.useRealTimers()
      })

      it("should handle very long domain names", async () => {
        const longDomain = "a".repeat(255) + ".com"

        mockChromeStorage.local.get.mockResolvedValue({ blockedDomains: [] })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addBlockedDomain(longDomain)

        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          blockedDomains: [longDomain]
        })
      })

      it("should handle domains with unicode characters", async () => {
        const unicodeDomain = "тест.рф" // Russian characters

        mockChromeStorage.local.get.mockResolvedValue({ blockedDomains: [] })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addBlockedDomain(unicodeDomain)

        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          blockedDomains: [unicodeDomain]
        })
      })
    })

    describe("race conditions", () => {
      it("should handle rapid sequential updates to same domain", async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-01-04T12:00:00Z"))

        mockChromeStorage.local.get.mockResolvedValue({ screenTimeData: {} })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        // Simulate rapid updates
        await storageManager.addTimeToCurrentDay("example.com", 10)
        await storageManager.addTimeToCurrentDay("example.com", 20)
        await storageManager.addTimeToCurrentDay("example.com", 30)

        expect(mockChromeStorage.local.set).toHaveBeenCalledTimes(3)

        vi.useRealTimers()
      })

      it("should handle concurrent blocked domain operations", async () => {
        mockChromeStorage.local.get.mockResolvedValue({ blockedDomains: [] })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await Promise.all([
          storageManager.addBlockedDomain("site1.com"),
          storageManager.addBlockedDomain("site2.com"),
          storageManager.addBlockedDomain("site3.com")
        ])

        // All three writes should occur (may result in race condition in real use)
        expect(mockChromeStorage.local.set).toHaveBeenCalledTimes(3)
      })
    })

    describe("null and undefined handling", () => {
      it("should handle null favicon gracefully", async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-01-04T12:00:00Z"))

        mockChromeStorage.local.get.mockResolvedValue({ screenTimeData: {} })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addTimeToCurrentDay("test.com", 30, undefined)

        const setCall = mockChromeStorage.local.set.mock.calls[0][0]
        const yearWeek = Object.keys(setCall.screenTimeData)[0]
        const dateKey = Object.keys(setCall.screenTimeData[yearWeek])[0]

        expect(setCall.screenTimeData[yearWeek][dateKey]["test.com"]).toEqual({
          time: 30,
          favicon: undefined
        })

        vi.useRealTimers()
      })

      it("should handle empty string favicon", async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-01-04T12:00:00Z"))

        mockChromeStorage.local.get.mockResolvedValue({ screenTimeData: {} })
        mockChromeStorage.local.set.mockResolvedValue(undefined)

        await storageManager.addTimeToCurrentDay("test.com", 30, "")

        const setCall = mockChromeStorage.local.set.mock.calls[0][0]
        const yearWeek = Object.keys(setCall.screenTimeData)[0]
        const dateKey = Object.keys(setCall.screenTimeData[yearWeek])[0]

        expect(
          setCall.screenTimeData[yearWeek][dateKey]["test.com"].favicon
        ).toBe("")

        vi.useRealTimers()
      })
    })
  })
})
