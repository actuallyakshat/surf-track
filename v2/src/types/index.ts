export interface DomainTimeData {
  time: number; // Duration in seconds
  favicon?: string;
}

export interface DailyScreenTime {
  [domain: string]: DomainTimeData;
}

export interface WeeklyScreenTime {
  [date: string]: DailyScreenTime; // date in YYYY-MM-DD format
}

export interface ScreenTimeData {
  [yearWeek: string]: WeeklyScreenTime; // yearWeek in YYYY_WW format
}

export interface ArchivedScreenTimeData {
  [yearMonth: string]: ScreenTimeData; // Archive by month or similar grouping if needed, or just same as ScreenTimeData
}

export interface TrackingState {
  currentUrl: string | null;
  startTime: number | null; // Timestamp in milliseconds
  lastActiveTime: number | null; // Timestamp for idle detection
  isIdle?: boolean; // Whether user is currently idle
  favicon?: string | null;
}

export interface StorageSchema {
  screenTimeData: ScreenTimeData;
  blockedDomains: string[];
  trackingState: TrackingState;
  archivedData?: ArchivedScreenTimeData;
  settings?: UserSettings;
}

export interface UserSettings {
  // Placeholder for future settings
  dataRetentionDays: number;
}
