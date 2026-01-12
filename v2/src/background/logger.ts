/**
 * Persistent Logger for Chrome Extension
 * Stores logs in chrome.storage.local for debugging
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR"
}

interface LogEntry {
  timestamp: number
  level: LogLevel
  source: string
  message: string
  data?: any
}

const MAX_LOGS = 1000 // Keep last 1000 logs
const STORAGE_KEY = "debug_logs"

export class Logger {
  private source: string
  private static enabled = true
  private static writeQueue: Promise<void> = Promise.resolve()

  constructor(source: string) {
    this.source = source
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * Log a warning
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * Log an error
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data)
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!Logger.enabled) return

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      source: this.source,
      message,
      data: data !== undefined ? this.serializeData(data) : undefined
    }

    // Log to console
    const consoleMessage = `[${new Date(entry.timestamp).toISOString()}] [${level}] [${this.source}] ${message}`
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage, data)
        break
      case LogLevel.INFO:
        console.info(consoleMessage, data)
        break
      case LogLevel.WARN:
        console.warn(consoleMessage, data)
        break
      case LogLevel.ERROR:
        console.error(consoleMessage, data)
        break
    }

    // Persist to storage (enqueued to prevent race conditions)
    this.enqueueLog(entry)
  }

  /**
   * Enqueue a log entry for persistent storage
   */
  private enqueueLog(entry: LogEntry): void {
    Logger.writeQueue = Logger.writeQueue
      .then(() => this.persistLog(entry))
      .catch((err) => {
        console.error("Failed to persist log:", err)
      })
  }

  /**
   * Serialize data for storage (handle circular references)
   */
  private serializeData(data: any): any {
    try {
      // Handle Error objects
      if (data instanceof Error) {
        return {
          name: data.name,
          message: data.message,
          stack: data.stack
        }
      }
      // Try to stringify and parse to remove circular references
      return JSON.parse(JSON.stringify(data))
    } catch (err) {
      return String(data)
    }
  }

  /**
   * Persist log entry to chrome.storage.local
   */
  private async persistLog(entry: LogEntry): Promise<void> {
    if (!chrome?.storage?.local) return

    try {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      const logs: LogEntry[] = result[STORAGE_KEY] || []

      // Add new log
      logs.push(entry)

      // Keep only last MAX_LOGS entries
      if (logs.length > MAX_LOGS) {
        logs.splice(0, logs.length - MAX_LOGS)
      }

      await chrome.storage.local.set({ [STORAGE_KEY]: logs })
    } catch (err) {
      console.error("Failed to persist log to storage:", err)
    }
  }

  /**
   * Get all stored logs
   */
  static async getLogs(): Promise<LogEntry[]> {
    if (!chrome?.storage?.local) return []

    try {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      return result[STORAGE_KEY] || []
    } catch (err) {
      console.error("Failed to get logs:", err)
      return []
    }
  }

  /**
   * Clear all stored logs
   */
  static async clearLogs(): Promise<void> {
    if (!chrome?.storage?.local) return

    try {
      await chrome.storage.local.remove(STORAGE_KEY)
      console.info("Logs cleared")
    } catch (err) {
      console.error("Failed to clear logs:", err)
    }
  }

  /**
   * Get logs as formatted string
   */
  static async getLogsAsString(filter?: {
    level?: LogLevel
    source?: string
    since?: number
  }): Promise<string> {
    const logs = await Logger.getLogs()

    let filteredLogs = logs

    if (filter) {
      filteredLogs = logs.filter((log) => {
        if (filter.level && log.level !== filter.level) return false
        if (filter.source && log.source !== filter.source) return false
        if (filter.since && log.timestamp < filter.since) return false
        return true
      })
    }

    return filteredLogs
      .map((log) => {
        const timestamp = new Date(log.timestamp).toISOString()
        const dataStr = log.data
          ? `\n  Data: ${JSON.stringify(log.data, null, 2)}`
          : ""
        return `[${timestamp}] [${log.level}] [${log.source}] ${log.message}${dataStr}`
      })
      .join("\n")
  }

  /**
   * Export logs as downloadable file
   */
  static async exportLogs(): Promise<string> {
    const logs = await Logger.getLogs()
    return JSON.stringify(logs, null, 2)
  }

  /**
   * Enable/disable logging
   */
  static setEnabled(enabled: boolean): void {
    Logger.enabled = enabled
  }
}
