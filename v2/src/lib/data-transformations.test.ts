import { describe, it, expect } from 'vitest';
import { extractDailyDomains, aggregateWeekData, extractAllDomains } from './data-transformations';
import { ScreenTimeData } from '../types';

describe('data-transformations', () => {
  const mockData: ScreenTimeData = {
    '2024_01': {
      '2024-01-01': {
        'google.com': { time: 100, favicon: 'google.ico' },
        'github.com': { time: 200, favicon: 'github.ico' }
      },
      '2024-01-02': {
        'youtube.com': { time: 300 }
      }
    },
    '2024_02': {
      '2024-01-08': {
        'google.com': { time: 50 },
        'stackoverflow.com': { time: 150 }
      }
    }
  };

  describe('extractDailyDomains', () => {
    it('should extract and sort domains for a specific date', () => {
      // 2024-01-01 should be in week 2024_01
      const result = extractDailyDomains(mockData, '2024-01-01');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ domain: 'github.com', time: 200, favicon: 'github.ico' });
      expect(result[1]).toEqual({ domain: 'google.com', time: 100, favicon: 'google.ico' });
    });

    it('should return empty array for date with no data', () => {
      const result = extractDailyDomains(mockData, '2024-01-03');
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent week', () => {
      const result = extractDailyDomains(mockData, '2025-01-01');
      expect(result).toEqual([]);
    });
  });

  describe('aggregateWeekData', () => {
    it('should sum up time for each day in a week', () => {
      const result = aggregateWeekData(mockData, '2024_01');
      
      expect(result).toEqual({
        '2024-01-01': 300,
        '2024-01-02': 300
      });
    });

    it('should return empty object for missing week', () => {
      const result = aggregateWeekData(mockData, '2024_99');
      expect(result).toEqual({});
    });
  });

  describe('extractAllDomains', () => {
    it('should return all unique domains sorted alphabetically', () => {
      const result = extractAllDomains(mockData);
      
      expect(result).toEqual([
        'github.com',
        'google.com',
        'stackoverflow.com',
        'youtube.com'
      ]);
    });

    it('should return empty array for empty data', () => {
      const result = extractAllDomains({});
      expect(result).toEqual([]);
    });
  });
});
