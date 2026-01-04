import { getYearWeek } from "../lib/time-utils"
import type {
  ArchivedScreenTimeData,
  DomainTimeData,
  ScreenTimeData,
  TrackingState
} from "../types"

export class StorageManager {
  private static instance: StorageManager
  private writeQueue: Promise<void> = Promise.resolve()

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  /**
   * Serializes storage writes to prevent race conditions during Read-Modify-Write operations.
   */
  private async enqueueWrite(task: () => Promise<void>): Promise<void> {
    const currentTask = this.writeQueue.then(task)
    this.writeQueue = currentTask.catch((error) => {
      console.error("Storage write queue error:", error)
    })
    return currentTask
  }

  async getTrackingState(): Promise<TrackingState | null> {
    try {
      const result = await chrome.storage.session.get("trackingState")
      return result.trackingState || null
    } catch (error) {
      console.error("Failed to get tracking state:", error)
      return null
    }
  }

  async setTrackingState(state: TrackingState): Promise<void> {
    try {
      await chrome.storage.session.set({ trackingState: state })
    } catch (error) {
      console.error("Failed to set tracking state:", error)
      throw error
    }
  }

  async updateTrackingState(partial: Partial<TrackingState>): Promise<void> {
    try {
      const currentState = await this.getTrackingState()
      const updatedState: TrackingState = {
        currentUrl:
          partial.currentUrl !== undefined
            ? partial.currentUrl
            : currentState?.currentUrl ?? null,
        startTime:
          partial.startTime !== undefined
            ? partial.startTime
            : currentState?.startTime ?? null,
        lastActiveTime:
          partial.lastActiveTime !== undefined
            ? partial.lastActiveTime
            : currentState?.lastActiveTime ?? null,
        isIdle:
          partial.isIdle !== undefined
            ? partial.isIdle
            : currentState?.isIdle ?? false,
        favicon:
          partial.favicon !== undefined
            ? partial.favicon
            : currentState?.favicon ?? null
      }
      await this.setTrackingState(updatedState)
    } catch (error) {
      console.error("Failed to update tracking state:", error)
      throw error
    }
  }

  async getScreenTimeData(): Promise<ScreenTimeData> {
    try {
      const result = await chrome.storage.local.get("screenTimeData")
      return result.screenTimeData || {}
    } catch (error) {
      console.error("Failed to get screen time data:", error)
      return {}
    }
  }

  async addTimeToCurrentDay(
    domain: string,
    seconds: number,
    favicon?: string
  ): Promise<void> {
    return this.enqueueWrite(async () => {
      try {
        const now = new Date()
        const yearWeek = getYearWeek(now)
        const dateKey = this.getDateKey(now)

        const data = await this.getScreenTimeData()

        if (!data[yearWeek]) {
          data[yearWeek] = {}
        }

        if (!data[yearWeek][dateKey]) {
          data[yearWeek][dateKey] = {}
        }

        if (!data[yearWeek][dateKey][domain]) {
          data[yearWeek][dateKey][domain] = {
            time: 0,
            favicon
          }
        }

        data[yearWeek][dateKey][domain].time += seconds

        if (favicon && !data[yearWeek][dateKey][domain].favicon) {
          data[yearWeek][dateKey][domain].favicon = favicon
        }

        await chrome.storage.local.set({ screenTimeData: data })
      } catch (error) {
        console.error("Failed to add time to current day:", error)
        throw error
      }
    })
  }

  async updateFavicon(domain: string, faviconUrl: string): Promise<void> {
    return this.enqueueWrite(async () => {
      try {
        const now = new Date()
        const yearWeek = getYearWeek(now)
        const dateKey = this.getDateKey(now)

        const data = await this.getScreenTimeData()

        if (
          data[yearWeek]?.[dateKey]?.[domain] &&
          !data[yearWeek][dateKey][domain].favicon
        ) {
          data[yearWeek][dateKey][domain].favicon = faviconUrl
          await chrome.storage.local.set({ screenTimeData: data })
        }
      } catch (error) {
        console.error("Failed to update favicon:", error)
        throw error
      }
    })
  }

  async getBlockedDomains(): Promise<string[]> {
    try {
      const result = await chrome.storage.local.get("blockedDomains")
      return result.blockedDomains || []
    } catch (error) {
      console.error("Failed to get blocked domains:", error)
      return []
    }
  }

  async addBlockedDomain(domain: string): Promise<void> {
    return this.enqueueWrite(async () => {
      try {
        const blockedDomains = await this.getBlockedDomains()
        if (!blockedDomains.includes(domain)) {
          const updated = [...blockedDomains, domain]
          await chrome.storage.local.set({ blockedDomains: updated })
        }
      } catch (error) {
        console.error("Failed to add blocked domain:", error)
        throw error
      }
    })
  }

  async removeBlockedDomain(domain: string): Promise<void> {
    return this.enqueueWrite(async () => {
      try {
        const blockedDomains = await this.getBlockedDomains()
        const filtered = blockedDomains.filter((d) => d !== domain)
        await chrome.storage.local.set({ blockedDomains: filtered })
      } catch (error) {
        console.error("Failed to remove blocked domain:", error)
        throw error
      }
    })
  }

  async isBlocked(domain: string): Promise<boolean> {
    try {
      const blockedDomains = await this.getBlockedDomains()
      return blockedDomains.includes(domain)
    } catch (error) {
      console.error("Failed to check if domain is blocked:", error)
      return false
    }
  }

  async getArchivedData(): Promise<ArchivedScreenTimeData> {
    try {
      const result = await chrome.storage.local.get("archivedData")
      return result.archivedData || {}
    } catch (error) {
      console.error("Failed to get archived data:", error)
      return {}
    }
  }

  async addToArchive(archivedData: ArchivedScreenTimeData): Promise<void> {
    return this.enqueueWrite(async () => {
      try {
        const currentArchive = await this.getArchivedData()
        const mergedArchive = { ...currentArchive, ...archivedData }
        await chrome.storage.local.set({ archivedData: mergedArchive })
      } catch (error) {
        console.error("Failed to add to archive:", error)
        throw error
      }
    })
  }

  private getDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
}
