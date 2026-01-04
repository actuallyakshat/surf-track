/**
 * Shared test utilities for background service tests
 */

import { vi } from 'vitest';
import type {
  ScreenTimeData,
  TrackingState,
  ArchivedScreenTimeData,
  DomainTimeData,
} from '../types';

/**
 * Creates a mock chrome.storage.local object with spies
 */
export function createMockStorageLocal() {
  return {
    get: vi.fn(),
    set: vi.fn(),
  };
}

/**
 * Creates a mock chrome.storage.session object with spies
 */
export function createMockStorageSession() {
  return {
    get: vi.fn(),
    set: vi.fn(),
  };
}

/**
 * Creates a mock chrome.idle API object with spies
 */
export function createMockChromeIdle() {
  const listeners: Array<(state: chrome.idle.IdleState) => void> = [];

  return {
    setDetectionInterval: vi.fn(),
    queryState: vi.fn(),
    onStateChanged: {
      addListener: vi.fn((listener) => {
        listeners.push(listener);
      }),
      removeListener: vi.fn((listener) => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }),
    },
    // Helper to get registered listeners for testing
    _getListeners: () => listeners,
    // Helper to trigger state changes
    _triggerStateChange: (state: chrome.idle.IdleState) => {
      listeners.forEach((listener) => listener(state));
    },
  };
}

/**
 * Creates a mock chrome.alarms API object with spies
 */
export function createMockChromeAlarms() {
  const listeners: Array<(alarm: chrome.alarms.Alarm) => void> = [];

  return {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn((listener) => {
        listeners.push(listener);
      }),
      removeListener: vi.fn((listener) => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }),
    },
    // Helper to trigger alarms
    _triggerAlarm: (name: string) => {
      const alarm: chrome.alarms.Alarm = {
        name,
        scheduledTime: Date.now(),
      };
      listeners.forEach((listener) => listener(alarm));
    },
  };
}

/**
 * Factory functions for creating test data
 */

export function createTrackingState(
  overrides?: Partial<TrackingState>
): TrackingState {
  return {
    currentUrl: 'https://example.com',
    startTime: Date.now(),
    lastActiveTime: Date.now(),
    ...overrides,
  };
}

export function createDomainTimeData(
  overrides?: Partial<DomainTimeData>
): DomainTimeData {
  return {
    time: 100,
    favicon: 'icon.png',
    ...overrides,
  };
}

export function createScreenTimeData(
  data?: Record<string, Record<string, Record<string, DomainTimeData>>>
): ScreenTimeData {
  return data || {
    '2026_01': {
      '2026-01-04': {
        'example.com': createDomainTimeData(),
      },
    },
  };
}

export function createArchivedScreenTimeData(
  data?: Record<string, ScreenTimeData>
): ArchivedScreenTimeData {
  return data || {
    '2025-12': {
      '2025_52': {
        '2025-12-25': {
          'archived.com': createDomainTimeData({ time: 50 }),
        },
      },
    },
  };
}

/**
 * Helper to create a date string in YYYY-MM-DD format
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to create a year-week string in YYYY_WW format
 */
export function formatYearWeek(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}_${String(weekNo).padStart(2, '0')}`;
}

/**
 * Helper to wait for async operations
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await waitFor(10);
  }
}

/**
 * Mock console methods to prevent noise in tests
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  const spies = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };

  const restore = () => {
    Object.entries(spies).forEach(([key, spy]) => {
      spy.mockRestore();
    });
  };

  return { spies, restore };
}

/**
 * Helper to assert storage was called with specific data
 */
export function assertStorageSetWith(
  mockSet: any,
  key: string,
  value: any,
  callIndex = 0
) {
  const call = mockSet.mock.calls[callIndex];
  if (!call) {
    throw new Error(`No call at index ${callIndex}`);
  }
  const data = call[0];
  expect(data).toHaveProperty(key);
  expect(data[key]).toEqual(value);
}
