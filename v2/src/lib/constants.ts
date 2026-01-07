export const ALARM_NAMES = {
  SAVE_DATA: "save_data_alarm",
  SYNC_STORAGE: "sync_storage_alarm",
  CHECK_IDLE: "check_idle_alarm"
} as const

export type AlarmName = (typeof ALARM_NAMES)[keyof typeof ALARM_NAMES]

export const IDLE_THRESHOLD_SECONDS = 60

export const DATA_RETENTION_DAYS = 90

/**
 * Maximum duration for a single tracking session in seconds.
 * Acts as a sanity check to prevent unrealistic time accumulation
 * if the periodic save alarm fails (e.g., during system sleep).
 * 5 minutes is generous enough for normal browsing but catches anomalies.
 */
export const MAX_SESSION_DURATION_SECONDS = 300

/**
 * Maximum gap in milliseconds to consider a service worker restart as "normal".
 * If the gap since lastActiveTime exceeds this, we assume the system was suspended
 * and don't count the elapsed time.
 */
export const MAX_RESUME_GAP_MS = 120000 // 2 minutes

/**
 * Domains that should be ignored for time tracking.
 * Includes Chrome internal pages, localhost, and other non-trackable domains.
 */
export const IGNORED_DOMAINS = [
  // Chrome internal hostnames (extracted from chrome:// URLs)
  "newtab",
  "extensions",
  "settings",
  "downloads",
  "history",
  "bookmarks",
  "flags",
  // Full chrome:// URLs (kept for backward compatibility)
  "chrome://extensions",
  "chrome://newtab",
  "chrome://settings",
  // Development and special pages
  "localhost",
  "about:blank",
  // Local files
  "local file"
] as const
