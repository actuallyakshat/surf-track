export const ALARM_NAMES = {
  SAVE_DATA: "save_data_alarm",
  SYNC_STORAGE: "sync_storage_alarm",
  CHECK_IDLE: "check_idle_alarm"
} as const

export type AlarmName = (typeof ALARM_NAMES)[keyof typeof ALARM_NAMES]

export const IDLE_THRESHOLD_SECONDS = 60

export const DATA_RETENTION_DAYS = 90

export const IGNORED_DOMAINS = [
  "newtab",
  "extensions",
  "localhost",
  "settings",
  "about:blank"
] as const
