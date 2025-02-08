export interface GlobalContextType {
  data: ScreenTimeData;
  setData: (data: ScreenTimeData) => void;
}

export interface ScreenTimeEntry {
  timeSpent: number;
  favicon?: string;
  weekNumber: number;
}

export interface DailyData {
  domains: {
    [domain: string]: ScreenTimeEntry;
  };
}

export interface WeeklyData {
  [date: string]: DailyData;
}

export interface ScreenTimeData {
  [weekNumber: number]: WeeklyData;
}
