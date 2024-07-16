export interface GlobalContextType {
  loading: boolean
  setLoading: (loading: boolean) => void
  isAuthenticated: boolean
  setIsAuthenticated: (isAuthenticated: boolean) => void
  data: ScreenTimeData
  setData: (data: ScreenTimeData) => void
  logoutHandler: () => void
}

interface ScreenTimeEntry {
  favicon?: string
  timeSpent: number
}

export interface DailyData {
  [domain: string]: ScreenTimeEntry
}

export interface ScreenTimeData {
  [date: string]: DailyData
}
