export interface GlobalContextType {
  loading: boolean
  setLoading: (loading: boolean) => void
  isAuthenticated: boolean
  setIsAuthenticated: (isAuthenticated: boolean) => void
  data: ScreenTimeData
  setData: (data: ScreenTimeData) => void
  logoutHandler: () => void
}

// Define the interface for a screen time entry
export interface ScreenTimeEntry {
  timeSpent: number
  favicon?: string
  weekNumber: number
}

// Define the interface for daily data
export interface DailyData {
  [domain: string]: ScreenTimeEntry
}

// Define the interface for the weekly data
export interface WeeklyData {
  [date: string]: DailyData
}

// Define the interface for screen time data
export interface ScreenTimeData {
  [weekNumber: number]: WeeklyData
}
