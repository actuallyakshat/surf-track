interface WebsiteData {
  time: number;
  favicon?: string; // Optional since some entries may not have a favicon
}

// Daily data structure
interface DailyData {
  [domain: string]: WebsiteData;
}

// Weekly data structure (yyyy_ww as key)
interface WeeklyData {
  [date: string]: DailyData;
}

// Complete screen time data structure
interface ScreenTimeData {
  [yearWeek: string]: WeeklyData;
}

interface GlobalContextType {
  data: ScreenTimeData;
  setData: (data: ScreenTimeData) => void;
}

interface TabChangeResult {
  currentUrl: string;
  startTime: number;
  favicon?: string;
}

export type {
  DailyData,
  WebsiteData,
  WeeklyData,
  ScreenTimeData,
  GlobalContextType,
  TabChangeResult,
};
