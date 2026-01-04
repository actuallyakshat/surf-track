import { ScreenTimeData, DomainTimeData } from '../types';
import { getYearWeek } from './time-utils';

export interface DomainTimeDataWithDomain extends DomainTimeData {
  domain: string;
}

export function extractDailyDomains(data: ScreenTimeData, date: string): DomainTimeDataWithDomain[] {
  // Ensure we treat the date string as local time to avoid timezone shifts
  const yearWeek = getYearWeek(new Date(date + 'T00:00:00'));
  
  const weekData = data[yearWeek];
  if (!weekData) return [];
  
  const dailyData = weekData[date];
  if (!dailyData) return [];

  return Object.entries(dailyData)
    .map(([domain, data]) => ({
      domain,
      ...data
    }))
    .sort((a, b) => b.time - a.time);
}

export function aggregateWeekData(data: ScreenTimeData, yearWeek: string): { [date: string]: number } {
  const weekData = data[yearWeek];
  if (!weekData) return {};
  
  const result: { [date: string]: number } = {};
  
  Object.entries(weekData).forEach(([date, dailyData]) => {
    let total = 0;
    Object.values(dailyData).forEach(d => total += d.time);
    result[date] = total;
  });
  
  return result;
}

export function extractAllDomains(data: ScreenTimeData): string[] {
  const domains = new Set<string>();
  
  Object.values(data).forEach(weekData => {
    Object.values(weekData).forEach(dailyData => {
      Object.keys(dailyData).forEach(domain => domains.add(domain));
    });
  });
  
  return Array.from(domains).sort();
}
