import { ALARM_NAMES, DATA_RETENTION_DAYS } from "../lib/constants"
import { getTodayDate } from "../lib/time-utils"
import type {
  ArchivedScreenTimeData,
  ScreenTimeData,
  StorageSchema
} from "../types"
import { Logger } from "./logger"

const ARCHIVE_ALARM_NAME = "archive_data_alarm"
const logger = new Logger("DataArchiver")

export class DataArchiver {
  private static instance: DataArchiver
  private isRunning = false

  private constructor() {}

  static getInstance(): DataArchiver {
    if (!DataArchiver.instance) {
      DataArchiver.instance = new DataArchiver()
    }
    return DataArchiver.instance
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.scheduleArchiving()
    this.setupAlarmListener()
  }

  stop(): void {
    this.isRunning = false
    chrome.alarms.clear(ARCHIVE_ALARM_NAME)
  }

  scheduleArchiving(): void {
    chrome.alarms.create(ARCHIVE_ALARM_NAME, {
      delayInMinutes: 1,
      periodInMinutes: 24 * 60
    })
  }

  private setupAlarmListener(): void {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === ARCHIVE_ALARM_NAME) {
        this.archiveOldData().catch((error) => {
          logger.error("Failed to archive data", error)
        })
      }
    })
  }

  async archiveOldData(): Promise<{ archived: number; errors: string[] }> {
    const errors: string[] = []
    let archived = 0

    try {
      const cutoffDate = this.calculateCutoffDate()
      const storage = await chrome.storage.local.get([
        "screenTimeData",
        "archivedData"
      ])

      const screenTimeData: ScreenTimeData = storage.screenTimeData || {}
      const archivedData: ArchivedScreenTimeData = storage.archivedData || {}

      const oldData = this.extractOldData(screenTimeData, cutoffDate)
      const newScreenTimeData = this.removeOldData(screenTimeData, cutoffDate)

      const oldDataCount = this.countEntries(oldData)

      if (oldDataCount > 0) {
        const updatedArchive = this.mergeIntoArchive(archivedData, oldData)

        await chrome.storage.local.set({
          screenTimeData: newScreenTimeData,
          archivedData: updatedArchive
        })

        archived = oldDataCount
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"
      errors.push(errorMessage)
    }

    return { archived, errors }
  }

  async getArchivedData(): Promise<ArchivedScreenTimeData> {
    const storage = await chrome.storage.local.get("archivedData")
    return storage.archivedData || {}
  }

  private calculateCutoffDate(): string {
    const today = new Date()
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - DATA_RETENTION_DAYS)

    const year = cutoff.getFullYear()
    const month = String(cutoff.getMonth() + 1).padStart(2, "0")
    const day = String(cutoff.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  private extractOldData(
    screenTimeData: ScreenTimeData,
    cutoffDate: string
  ): ScreenTimeData {
    const oldData: ScreenTimeData = {}

    for (const [yearWeek, weekData] of Object.entries(screenTimeData)) {
      for (const [date, dailyData] of Object.entries(weekData)) {
        if (date < cutoffDate) {
          if (!oldData[yearWeek]) {
            oldData[yearWeek] = {}
          }
          oldData[yearWeek][date] = dailyData
        }
      }
    }

    return oldData
  }

  private removeOldData(
    screenTimeData: ScreenTimeData,
    cutoffDate: string
  ): ScreenTimeData {
    const newData: ScreenTimeData = {}

    for (const [yearWeek, weekData] of Object.entries(screenTimeData)) {
      const newWeekData: Record<string, any> = {}
      let hasRecentData = false

      for (const [date, dailyData] of Object.entries(weekData)) {
        if (date >= cutoffDate) {
          newWeekData[date] = dailyData
          hasRecentData = true
        }
      }

      if (hasRecentData) {
        newData[yearWeek] = newWeekData
      }
    }

    return newData
  }

  private mergeIntoArchive(
    archivedData: ArchivedScreenTimeData,
    oldData: ScreenTimeData
  ): ArchivedScreenTimeData {
    const merged: ArchivedScreenTimeData = { ...archivedData }

    for (const [yearWeek, weekData] of Object.entries(oldData)) {
      for (const [date, dailyData] of Object.entries(weekData)) {
        const yearMonth = date.substring(0, 7)

        if (!merged[yearMonth]) {
          merged[yearMonth] = {}
        }

        if (!merged[yearMonth][yearWeek]) {
          merged[yearMonth][yearWeek] = {}
        }

        merged[yearMonth][yearWeek][date] = dailyData
      }
    }

    return merged
  }

  private countEntries(data: ScreenTimeData): number {
    let count = 0
    for (const weekData of Object.values(data)) {
      count += Object.keys(weekData).length
    }
    return count
  }
}
