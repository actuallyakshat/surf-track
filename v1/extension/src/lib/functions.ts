export const formatSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const formattedHours = hours > 0 ? `${hours}h ` : "";
  const formattedMinutes = minutes > 0 ? `${minutes}m ` : "";
  const formattedSeconds = remainingSeconds > 0 ? `${remainingSeconds}s` : "";

  return `${formattedHours}${formattedMinutes}${formattedSeconds}`.trim();
};

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNumber;
}

interface WebsiteData {
  time: number;
  favicon?: string;
}

interface SortedWebsiteData extends WebsiteData {
  domain: string;
}

export function sortScreenTimeDataForDate(
  dayData: Record<string, WebsiteData>
): SortedWebsiteData[] {
  return Object.entries(dayData)
    .map(([domain, data]) => ({
      domain,
      time: data.time,
      favicon: data.favicon,
    }))
    .sort((a, b) => b.time - a.time);
}

export function getDataKey(date: Date): string {
  const yearWeek = `${date.getFullYear()}_${String(
    getWeekNumber(date)
  ).padStart(2, "0")}`;

  return yearWeek;
}

export interface ChartDataPoint {
  day: string;
  screentime: number;
  dateKey: string;
}

export interface DailyData {
  domain: string;
  time: number;
  favicon?: string;
}

export type { WebsiteData, SortedWebsiteData };
