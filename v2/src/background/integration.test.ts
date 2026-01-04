import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageManager } from './storage-manager';
import { IdleDetector } from './idle-detector';
import { DataArchiver } from './data-archiver';
import type { ScreenTimeData, TrackingState, ArchivedScreenTimeData } from '../types';

/**
 * Integration Tests for Background Services
 * 
 * Tests the interactions between StorageManager, IdleDetector, and DataArchiver
 * in realistic scenarios without actually using Chrome APIs.
 */

// Mock Chrome APIs
const mockStorageLocalData: Record<string, any> = {};
const mockStorageSessionData: Record<string, any> = {};
const mockAlarms: Record<string, chrome.alarms.Alarm> = {};
let mockIdleState: chrome.idle.IdleState = 'active';
let idleStateChangeListeners: Array<(newState: chrome.idle.IdleState) => void> = [];
let alarmListeners: Array<(alarm: chrome.alarms.Alarm) => void> = [];

const mockStorageLocal = {
  get: vi.fn((keys: string | string[] | null) => {
    return Promise.resolve(
      typeof keys === 'string'
        ? { [keys]: mockStorageLocalData[keys] }
        : Array.isArray(keys)
        ? keys.reduce((acc, key) => ({ ...acc, [key]: mockStorageLocalData[key] }), {})
        : { ...mockStorageLocalData }
    );
  }),
  set: vi.fn((items: Record<string, any>) => {
    Object.assign(mockStorageLocalData, items);
    return Promise.resolve();
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorageLocalData).forEach(key => delete mockStorageLocalData[key]);
    return Promise.resolve();
  }),
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

const mockStorageSession = {
  get: vi.fn((keys: string | string[] | null) => {
    return Promise.resolve(
      typeof keys === 'string'
        ? { [keys]: mockStorageSessionData[keys] }
        : Array.isArray(keys)
        ? keys.reduce((acc, key) => ({ ...acc, [key]: mockStorageSessionData[key] }), {})
        : { ...mockStorageSessionData }
    );
  }),
  set: vi.fn((items: Record<string, any>) => {
    Object.assign(mockStorageSessionData, items);
    return Promise.resolve();
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorageSessionData).forEach(key => delete mockStorageSessionData[key]);
    return Promise.resolve();
  }),
};

const mockIdle = {
  setDetectionInterval: vi.fn((interval: number) => {}),
  queryState: vi.fn((interval: number, callback: (state: chrome.idle.IdleState) => void) => {
    callback(mockIdleState);
  }),
  onStateChanged: {
    addListener: vi.fn((callback: (newState: chrome.idle.IdleState) => void) => {
      idleStateChangeListeners.push(callback);
    }),
    removeListener: vi.fn((callback: (newState: chrome.idle.IdleState) => void) => {
      idleStateChangeListeners = idleStateChangeListeners.filter(listener => listener !== callback);
    }),
  },
};

const mockAlarmsAPI = {
  create: vi.fn((name: string, alarmInfo: chrome.alarms.AlarmCreateInfo) => {
    mockAlarms[name] = {
      name,
      scheduledTime: Date.now() + (alarmInfo.delayInMinutes || 0) * 60000,
      periodInMinutes: alarmInfo.periodInMinutes,
    };
  }),
  clear: vi.fn((name: string) => {
    delete mockAlarms[name];
    return Promise.resolve(true);
  }),
  clearAll: vi.fn(() => {
    Object.keys(mockAlarms).forEach(key => delete mockAlarms[key]);
    return Promise.resolve(true);
  }),
  onAlarm: {
    addListener: vi.fn((callback: (alarm: chrome.alarms.Alarm) => void) => {
      alarmListeners.push(callback);
    }),
    removeListener: vi.fn((callback: (alarm: chrome.alarms.Alarm) => void) => {
      alarmListeners = alarmListeners.filter(listener => listener !== callback);
    }),
  },
};

// Setup global chrome mock
global.chrome = {
  storage: {
    local: mockStorageLocal as any,
    session: mockStorageSession as any,
  },
  idle: mockIdle as any,
  alarms: mockAlarmsAPI as any,
} as any;

// Helper to simulate idle state changes
function simulateIdleStateChange(newState: chrome.idle.IdleState) {
  mockIdleState = newState;
  idleStateChangeListeners.forEach(listener => listener(newState));
}

// Helper to trigger alarm
function triggerAlarm(name: string) {
  const alarm = mockAlarms[name];
  if (alarm) {
    alarmListeners.forEach(listener => listener(alarm));
  }
}

// Helper to create test screen time data
function createTestScreenTimeData(daysAgo: number, domain: string, time: number): ScreenTimeData {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(12, 0, 0, 0);
  
  const year = d.getUTCFullYear();
  const week = getWeekNumber(d);
  const yearWeek = `${year}_${String(week).padStart(2, '0')}`;
  const dateKey = d.toISOString().split('T')[0];

  return {
    [yearWeek]: {
      [dateKey]: {
        [domain]: { time, favicon: `https://${domain}/favicon.ico` }
      }
    }
  };
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Helper to merge screen time data
function mergeScreenTimeData(...datasets: ScreenTimeData[]): ScreenTimeData {
  const merged: ScreenTimeData = {};
  
  datasets.forEach(dataset => {
    Object.entries(dataset).forEach(([yearWeek, weekData]) => {
      if (!merged[yearWeek]) {
        merged[yearWeek] = {};
      }
      Object.entries(weekData).forEach(([date, dailyData]) => {
        if (!merged[yearWeek][date]) {
          merged[yearWeek][date] = {};
        }
        Object.entries(dailyData).forEach(([domain, timeData]) => {
          merged[yearWeek][date][domain] = timeData;
        });
      });
    });
  });
  
  return merged;
}

describe('Background Services Integration Tests', () => {
  let storageManager: StorageManager;
  let idleDetector: IdleDetector;
  let dataArchiver: DataArchiver;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-04T12:00:00Z'));
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Clear storage
    Object.keys(mockStorageLocalData).forEach(key => delete mockStorageLocalData[key]);
    Object.keys(mockStorageSessionData).forEach(key => delete mockStorageSessionData[key]);
    
    // Clear alarms
    Object.keys(mockAlarms).forEach(key => delete mockAlarms[key]);
    
    // Reset listeners
    idleStateChangeListeners = [];
    alarmListeners = [];
    
    // Reset idle state
    mockIdleState = 'active';
    
    // Get fresh instances
    storageManager = StorageManager.getInstance();
    idleDetector = IdleDetector.getInstance();
    dataArchiver = DataArchiver.getInstance();
  });

  afterEach(() => {
    // Stop any running services
    idleDetector.stop();
    dataArchiver.stop();
    vi.useRealTimers();
  });

  describe('Scenario 1: Full Tracking Lifecycle', () => {
    it('should track a complete session from start to idle and persist data', async () => {
      // 1. Initialize tracking state
      const initialState: TrackingState = {
        currentUrl: 'https://example.com',
        startTime: Date.now(),
        lastActiveTime: Date.now(),
      };

      await storageManager.setTrackingState(initialState);

      // 2. Verify state was saved to session storage
      const retrievedState = await storageManager.getTrackingState();
      expect(retrievedState).toEqual(initialState);
      expect(mockStorageSession.set).toHaveBeenCalledWith({ trackingState: initialState });

      // 3. Start idle detection
      const idleStateChanges: boolean[] = [];
      idleDetector.start({
        onStateChange: (isIdle) => {
          idleStateChanges.push(isIdle);
        }
      });

      expect(mockIdle.setDetectionInterval).toHaveBeenCalled();

      // 4. Add some screen time
      await storageManager.addTimeToCurrentDay('example.com', 120, 'https://example.com/favicon.ico');

      const screenTimeData = await storageManager.getScreenTimeData();
      const today = new Date();
      const year = today.getFullYear();
      const week = getWeekNumber(today);
      const yearWeek = `${year}_${String(week).padStart(2, '0')}`;
      const dateKey = today.toISOString().split('T')[0];

      expect(screenTimeData[yearWeek][dateKey]['example.com'].time).toBe(120);

      // 5. Simulate idle state transition
      simulateIdleStateChange('idle');

      // Wait for debounce (300ms in IdleDetector) using fake timers
      vi.advanceTimersByTime(350);

      // 6. Verify idle callback was triggered
      expect(idleStateChanges).toContain(true);

      // 7. Update tracking state to reflect idle
      await storageManager.updateTrackingState({
        currentUrl: null,
        startTime: null,
      });

      const updatedState = await storageManager.getTrackingState();
      expect(updatedState?.currentUrl).toBeNull();
      expect(updatedState?.startTime).toBeNull();

      // 8. Simulate active state return
      simulateIdleStateChange('active');
      vi.advanceTimersByTime(350);

      expect(idleStateChanges).toContain(false);
    });
  });

  describe('Scenario 2: Service Worker Restart Recovery', () => {
    it('should persist and restore tracking state across service worker restarts', async () => {
      // 1. Save tracking state before "restart"
      const preRestartState: TrackingState = {
        currentUrl: 'https://github.com',
        startTime: Date.now() - 60000, // Started 1 minute ago
        lastActiveTime: Date.now() - 5000, // Active 5 seconds ago
      };

      await storageManager.setTrackingState(preRestartState);

      // 2. Add some screen time data
      await storageManager.addTimeToCurrentDay('github.com', 60);
      
      // 3. Simulate service worker restart by clearing module state
      // (In real world, getInstance would return new instance with cleared state)
      // Here we just verify storage persistence
      
      const preRestartData = await storageManager.getScreenTimeData();
      expect(Object.keys(preRestartData).length).toBeGreaterThan(0);

      // 4. Retrieve state after "restart"
      const postRestartState = await storageManager.getTrackingState();
      
      // 5. Verify state persisted correctly
      expect(postRestartState).toEqual(preRestartState);
      expect(postRestartState?.currentUrl).toBe('https://github.com');
      expect(postRestartState?.startTime).toBe(preRestartState.startTime);

      // 6. Verify screen time data also persisted
      const postRestartData = await storageManager.getScreenTimeData();
      expect(postRestartData).toEqual(preRestartData);
    });

    it('should handle corrupted tracking state gracefully', async () => {
      // 1. Manually corrupt the session storage
      mockStorageSessionData.trackingState = { corrupted: true, invalid: 'data' };

      // 2. Try to retrieve state - should handle gracefully
      const state = await storageManager.getTrackingState();
      
      // The state will be returned as-is since we don't have validation
      // In production, you might want to add schema validation
      expect(state).toBeDefined();
    });
  });

  describe('Scenario 3: Idle Detection During Tracking', () => {
    it('should pause tracking on idle and resume on active', async () => {
      const stateChanges: Array<{ state: string; timestamp: number }> = [];

      // 1. Start tracking
      const trackingState: TrackingState = {
        currentUrl: 'https://stackoverflow.com',
        startTime: Date.now(),
        lastActiveTime: Date.now(),
      };

      await storageManager.setTrackingState(trackingState);

      // 2. Start idle detector
      idleDetector.start({
        onStateChange: (isIdle) => {
          stateChanges.push({ state: isIdle ? 'idle' : 'active', timestamp: Date.now() });
        }
      });

      // 3. Simulate active period and add time
      await storageManager.addTimeToCurrentDay('stackoverflow.com', 30);

      // 4. Simulate idle transition
      simulateIdleStateChange('idle');
      vi.advanceTimersByTime(350);

      expect(stateChanges.length).toBe(1);
      expect(stateChanges[0].state).toBe('idle');

      // 5. Save current session time before idle
      const beforeIdleData = await storageManager.getScreenTimeData();
      const today = new Date();
      const year = today.getFullYear();
      const week = getWeekNumber(today);
      const yearWeek = `${year}_${String(week).padStart(2, '0')}`;
      const dateKey = today.toISOString().split('T')[0];

      expect(beforeIdleData[yearWeek][dateKey]['stackoverflow.com'].time).toBe(30);

      // 6. Clear tracking state to indicate paused tracking
      await storageManager.updateTrackingState({
        currentUrl: null,
        startTime: null,
      });

      // 7. Simulate active return
      simulateIdleStateChange('active');
      vi.advanceTimersByTime(350);

      expect(stateChanges.length).toBe(2);
      expect(stateChanges[1].state).toBe('active');

      // 8. Resume tracking with new start time
      await storageManager.updateTrackingState({
        currentUrl: 'https://stackoverflow.com',
        startTime: Date.now(),
        lastActiveTime: Date.now(),
      });

      const resumedState = await storageManager.getTrackingState();
      expect(resumedState?.currentUrl).toBe('https://stackoverflow.com');
      expect(resumedState?.startTime).toBeDefined();
    });

    it('should handle locked state as idle', async () => {
      const idleStates: boolean[] = [];

      idleDetector.start({
        onStateChange: (isIdle) => {
          idleStates.push(isIdle);
        }
      });

      // Simulate locked state
      simulateIdleStateChange('locked');
      vi.advanceTimersByTime(350);

      // Locked should be treated as idle
      expect(idleStates).toContain(true);

      // Return to active
      simulateIdleStateChange('active');
      vi.advanceTimersByTime(350);

      expect(idleStates).toContain(false);
    });
  });

  describe('Scenario 4: Data Archiving Workflow', () => {
    it('should archive old data (>90 days) and keep recent data', async () => {
      // 1. Create mixed age data
      const recentData1 = createTestScreenTimeData(10, 'github.com', 3600);
      const recentData2 = createTestScreenTimeData(30, 'stackoverflow.com', 1800);
      const oldData1 = createTestScreenTimeData(100, 'oldsite.com', 7200);
      const oldData2 = createTestScreenTimeData(120, 'ancientsite.com', 3600);

      const mixedData = mergeScreenTimeData(recentData1, recentData2, oldData1, oldData2);

      // 2. Save to storage
      mockStorageLocalData.screenTimeData = mixedData;

      // 3. Run archiver
      const result = await dataArchiver.archiveOldData();

      // 4. Verify archiving happened
      expect(result.archived).toBe(2); // 2 old entries
      expect(result.errors).toHaveLength(0);

      // 5. Check that old data was moved to archive
      const archivedData = await storageManager.getArchivedData();
      expect(archivedData).toBeDefined();

      // Find the archived entries
      let foundOldSite = false;
      let foundAncientSite = false;

      Object.values(archivedData).forEach(yearMonthData => {
        Object.values(yearMonthData).forEach(weekData => {
          Object.values(weekData).forEach(dailyData => {
            if (dailyData['oldsite.com']) foundOldSite = true;
            if (dailyData['ancientsite.com']) foundAncientSite = true;
          });
        });
      });

      expect(foundOldSite).toBe(true);
      expect(foundAncientSite).toBe(true);

      // 6. Check that recent data remains in main storage
      const remainingData = await storageManager.getScreenTimeData();
      let foundGithub = false;
      let foundStackOverflow = false;

      Object.values(remainingData).forEach(weekData => {
        Object.values(weekData).forEach(dailyData => {
          if (dailyData['github.com']) foundGithub = true;
          if (dailyData['stackoverflow.com']) foundStackOverflow = true;
        });
      });

      expect(foundGithub).toBe(true);
      expect(foundStackOverflow).toBe(true);
    });

    it('should retrieve archived data correctly', async () => {
      // 1. Create and archive old data
      const oldData = createTestScreenTimeData(100, 'archived.com', 5000);
      mockStorageLocalData.screenTimeData = oldData;

      await dataArchiver.archiveOldData();

      // 2. Retrieve archived data
      const archived = await dataArchiver.getArchivedData();

      expect(archived).toBeDefined();
      expect(Object.keys(archived).length).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', async () => {
      // No data in storage
      mockStorageLocalData.screenTimeData = {};

      const result = await dataArchiver.archiveOldData();

      expect(result.archived).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Scenario 5: Blocked Domain Operations', () => {
    it('should add, check, and remove blocked domains', async () => {
      // 1. Add multiple domains
      await storageManager.addBlockedDomain('facebook.com');
      await storageManager.addBlockedDomain('twitter.com');
      await storageManager.addBlockedDomain('reddit.com');

      // 2. Verify all are blocked
      expect(await storageManager.isBlocked('facebook.com')).toBe(true);
      expect(await storageManager.isBlocked('twitter.com')).toBe(true);
      expect(await storageManager.isBlocked('reddit.com')).toBe(true);

      // 3. Verify non-blocked domain
      expect(await storageManager.isBlocked('github.com')).toBe(false);

      // 4. Get all blocked domains
      const blockedDomains = await storageManager.getBlockedDomains();
      expect(blockedDomains).toHaveLength(3);
      expect(blockedDomains).toContain('facebook.com');
      expect(blockedDomains).toContain('twitter.com');
      expect(blockedDomains).toContain('reddit.com');

      // 5. Remove one domain
      await storageManager.removeBlockedDomain('twitter.com');

      // 6. Verify removal
      expect(await storageManager.isBlocked('twitter.com')).toBe(false);
      expect(await storageManager.isBlocked('facebook.com')).toBe(true);
      expect(await storageManager.isBlocked('reddit.com')).toBe(true);

      // 7. Verify updated list
      const updatedList = await storageManager.getBlockedDomains();
      expect(updatedList).toHaveLength(2);
      expect(updatedList).not.toContain('twitter.com');
    });

    it('should handle concurrent add operations', async () => {
      // Add same domain multiple times concurrently
      await Promise.all([
        storageManager.addBlockedDomain('duplicate.com'),
        storageManager.addBlockedDomain('duplicate.com'),
        storageManager.addBlockedDomain('duplicate.com'),
      ]);

      const blockedDomains = await storageManager.getBlockedDomains();
      
      // Should only be added once
      const duplicateCount = blockedDomains.filter(d => d === 'duplicate.com').length;
      expect(duplicateCount).toBe(1);
    });

    it('should handle removing non-existent domain', async () => {
      await storageManager.addBlockedDomain('exists.com');
      
      // Remove domain that doesn't exist
      await storageManager.removeBlockedDomain('nonexistent.com');

      const blockedDomains = await storageManager.getBlockedDomains();
      expect(blockedDomains).toEqual(['exists.com']);
    });
  });

  describe('Scenario 6: Error Recovery', () => {
    it('should handle storage errors gracefully during write', async () => {
      // Mock storage.set to fail
      mockStorageLocal.set.mockRejectedValueOnce(new Error('Storage quota exceeded'));

      // Try to add time - should throw
      await expect(
        storageManager.addTimeToCurrentDay('example.com', 100)
      ).rejects.toThrow('Storage quota exceeded');

      // Restore normal operation
      mockStorageLocal.set.mockImplementation((items: Record<string, any>) => {
        Object.assign(mockStorageLocalData, items);
        return Promise.resolve();
      });

      // Verify subsequent operations work
      await storageManager.addTimeToCurrentDay('example.com', 50);
      const data = await storageManager.getScreenTimeData();
      expect(data).toBeDefined();
    });

    it('should return null/empty data on read errors', async () => {
      // Mock storage.get to fail
      mockStorageLocal.get.mockRejectedValueOnce(new Error('Storage read failed'));

      const screenTimeData = await storageManager.getScreenTimeData();
      expect(screenTimeData).toEqual({});

      mockStorageSession.get.mockRejectedValueOnce(new Error('Session read failed'));

      const trackingState = await storageManager.getTrackingState();
      expect(trackingState).toBeNull();
    });

    it('should handle archiving errors without crashing', async () => {
      // Create valid data
      const testData = createTestScreenTimeData(100, 'test.com', 1000);
      mockStorageLocalData.screenTimeData = testData;

      // Mock storage.set to fail during archiving
      mockStorageLocal.set.mockRejectedValueOnce(new Error('Archive write failed'));

      const result = await dataArchiver.archiveOldData();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Archive write failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty storage on first launch', async () => {
      // Fresh install - no data
      const trackingState = await storageManager.getTrackingState();
      const screenTimeData = await storageManager.getScreenTimeData();
      const blockedDomains = await storageManager.getBlockedDomains();
      const archivedData = await storageManager.getArchivedData();

      expect(trackingState).toBeNull();
      expect(screenTimeData).toEqual({});
      expect(blockedDomains).toEqual([]);
      expect(archivedData).toEqual({});
    });

    it('should handle rapid successive state changes', async () => {
      const states: TrackingState[] = [
        { currentUrl: 'https://site1.com', startTime: Date.now(), lastActiveTime: Date.now() },
        { currentUrl: 'https://site2.com', startTime: Date.now() + 1000, lastActiveTime: Date.now() + 1000 },
        { currentUrl: 'https://site3.com', startTime: Date.now() + 2000, lastActiveTime: Date.now() + 2000 },
        { currentUrl: null, startTime: null, lastActiveTime: Date.now() + 3000 },
      ];

      // Rapidly set states
      for (const state of states) {
        await storageManager.setTrackingState(state);
      }

      const finalState = await storageManager.getTrackingState();
      expect(finalState).toEqual(states[states.length - 1]);
    });

    it('should handle very large datasets', async () => {
      // Create large dataset (simulate 365 days of data for 50 domains)
      const largeData: ScreenTimeData = {};

      for (let day = 0; day < 365; day++) {
        const testData = createTestScreenTimeData(day, `domain${day % 50}.com`, Math.random() * 3600);
        Object.entries(testData).forEach(([yearWeek, weekData]) => {
          if (!largeData[yearWeek]) {
            largeData[yearWeek] = {};
          }
          Object.entries(weekData).forEach(([date, dailyData]) => {
            if (!largeData[yearWeek][date]) {
              largeData[yearWeek][date] = {};
            }
            Object.assign(largeData[yearWeek][date], dailyData);
          });
        });
      }

      mockStorageLocalData.screenTimeData = largeData;

      // Should handle large dataset
      const retrieved = await storageManager.getScreenTimeData();
      expect(Object.keys(retrieved).length).toBeGreaterThan(0);

      // Archiving should work with large dataset
      const result = await dataArchiver.archiveOldData();
      expect(result.errors).toHaveLength(0);
    });

    it('should handle concurrent storage operations from multiple sources', async () => {
      // Simulate multiple concurrent writes
      const operations = [
        storageManager.addTimeToCurrentDay('domain1.com', 100),
        storageManager.addTimeToCurrentDay('domain2.com', 200),
        storageManager.addTimeToCurrentDay('domain3.com', 300),
      ];

      await Promise.all(operations);

      // Add blocked domains to avoid race condition in mock storage
      await storageManager.addBlockedDomain('blocked1.com');
      await storageManager.addBlockedDomain('blocked2.com');

      const screenTimeData = await storageManager.getScreenTimeData();
      const blockedDomains = await storageManager.getBlockedDomains();

      // All operations should complete
      expect(Object.keys(screenTimeData).length).toBeGreaterThan(0);
      expect(blockedDomains.length).toBe(2);
    });

    it('should handle idle detector start/stop cycling', async () => {
      // Start and stop multiple times
      for (let i = 0; i < 5; i++) {
        idleDetector.start({
          onStateChange: () => {}
        });
        
        expect(mockIdle.setDetectionInterval).toHaveBeenCalled();
        
        idleDetector.stop();
      }

      // Should end in stopped state
      expect(idleStateChangeListeners.length).toBe(0);
    });

    it('should handle partial tracking state updates', async () => {
      // Set initial state
      await storageManager.setTrackingState({
        currentUrl: 'https://initial.com',
        startTime: 1000,
        lastActiveTime: 2000,
      });

      // Update only currentUrl
      await storageManager.updateTrackingState({ currentUrl: 'https://updated.com' });

      const state1 = await storageManager.getTrackingState();
      expect(state1?.currentUrl).toBe('https://updated.com');
      expect(state1?.startTime).toBe(1000);
      expect(state1?.lastActiveTime).toBe(2000);

      // Update only startTime
      await storageManager.updateTrackingState({ startTime: 5000 });

      const state2 = await storageManager.getTrackingState();
      expect(state2?.currentUrl).toBe('https://updated.com');
      expect(state2?.startTime).toBe(5000);
      expect(state2?.lastActiveTime).toBe(2000);
    });

    it('should handle favicon updates for existing domains', async () => {
      // Add time without favicon
      await storageManager.addTimeToCurrentDay('nofavicon.com', 100);

      // Update favicon later
      await storageManager.updateFavicon('nofavicon.com', 'https://nofavicon.com/icon.png');

      const data = await storageManager.getScreenTimeData();
      const today = new Date();
      const year = today.getFullYear();
      const week = getWeekNumber(today);
      const yearWeek = `${year}_${String(week).padStart(2, '0')}`;
      const dateKey = today.toISOString().split('T')[0];

      expect(data[yearWeek][dateKey]['nofavicon.com'].favicon).toBe('https://nofavicon.com/icon.png');
    });
  });

  describe('Cross-Service Integration', () => {
    it('should coordinate tracking lifecycle across all services', async () => {
      // 1. Start all services
      dataArchiver.start();
      
      const idleEvents: string[] = [];
      idleDetector.start({
        onStateChange: (isIdle) => {
          idleEvents.push(isIdle ? 'idle' : 'active');
        }
      });

      // 2. Begin tracking
      await storageManager.setTrackingState({
        currentUrl: 'https://example.com',
        startTime: Date.now(),
        lastActiveTime: Date.now(),
      });

      // 3. Add tracking data
      await storageManager.addTimeToCurrentDay('example.com', 60);

      // 4. Simulate idle
      simulateIdleStateChange('idle');
      vi.advanceTimersByTime(350);

      expect(idleEvents).toContain('idle');

      // 5. Pause tracking
      await storageManager.updateTrackingState({
        currentUrl: null,
        startTime: null,
      });

      // 6. Add old data for archiving
      const oldData = createTestScreenTimeData(100, 'old.com', 1000);
      mockStorageLocalData.screenTimeData = {
        ...await storageManager.getScreenTimeData(),
        ...oldData,
      };

      // 7. Run archiver
      const archiveResult = await dataArchiver.archiveOldData();
      expect(archiveResult.archived).toBeGreaterThan(0);

      // 8. Resume tracking
      simulateIdleStateChange('active');
      vi.advanceTimersByTime(350);

      expect(idleEvents).toContain('active');

      await storageManager.updateTrackingState({
        currentUrl: 'https://example.com',
        startTime: Date.now(),
        lastActiveTime: Date.now(),
      });

      // 9. Verify all data integrity
      const finalState = await storageManager.getTrackingState();
      const finalData = await storageManager.getScreenTimeData();
      const archivedData = await storageManager.getArchivedData();

      expect(finalState?.currentUrl).toBe('https://example.com');
      expect(Object.keys(finalData).length).toBeGreaterThan(0);
      expect(Object.keys(archivedData).length).toBeGreaterThan(0);

      // 10. Stop all services
      idleDetector.stop();
      dataArchiver.stop();
    });
  });
});
