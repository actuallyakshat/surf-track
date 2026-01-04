import type { TrackingState } from "../types";
import { StorageManager } from "./storage-manager";
import { ALARM_NAMES } from "../lib/constants";
import { getDomainFromUrl, isIgnoredDomain } from "../lib/domain-utils";
import { Logger } from "./logger";

const logger = new Logger("TrackingEngine");

export class TrackingEngine {
  private storageManager: StorageManager;

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
  }

  /**
   * Initializes the tracking engine from a clean slate.
   * Resets tracking state, sets up periodic save alarm, and starts tracking the active tab.
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing TrackingEngine");
      
      // Reset tracking state to clean slate
      await this.resetTrackingState();

      // Setup periodic save alarm
      await this.setupPeriodicSaveAlarm();

      // Get currently active tab and start tracking if valid
      await this.startTrackingActiveTab();

      logger.info("TrackingEngine initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize TrackingEngine", error);
      throw error;
    }
  }

  /**
   * Resumes tracking after a service worker restart.
   * Restores previous tracking state if it was active and ensures periodic save alarm exists.
   */
  async resume(): Promise<void> {
    try {
      logger.info("Resuming TrackingEngine after restart");
      
      // Get existing tracking state
      const trackingState = await this.storageManager.getTrackingState();
      logger.debug("Current tracking state", trackingState);

      // If tracking was active, continue tracking
      if (trackingState?.currentUrl && trackingState?.startTime) {
        logger.info("Resuming tracking", {
          url: trackingState.currentUrl,
          startTime: new Date(trackingState.startTime).toISOString(),
        });

        // Update lastActiveTime to current timestamp to mark as active
        await this.storageManager.updateTrackingState({
          lastActiveTime: Date.now(),
        });
      } else {
        logger.info("No active tracking to resume, starting fresh");
        // Start tracking the current active tab
        await this.startTrackingActiveTab();
      }

      // Ensure periodic save alarm exists
      await this.setupPeriodicSaveAlarm();

      logger.info("TrackingEngine resumed successfully");
    } catch (error) {
      logger.error("Failed to resume TrackingEngine", error);
      throw error;
    }
  }

  /**
   * Handles window focus changes.
   * Called when user switches between Chrome windows or to a different application.
   * @param windowId - The ID of the focused window, or chrome.windows.WINDOW_ID_NONE (-1) if focus moved outside Chrome
   */
  async handleWindowFocusChange(windowId: number): Promise<void> {
    try {
      // User switched to a different application
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        logger.info("Focus moved outside Chrome, saving session");
        await this.saveCurrentSession();
        await this.resetTrackingState();
        return;
      }

      // User switched to a Chrome window - get the active tab in that window
      const [activeTab] = await chrome.tabs.query({
        active: true,
        windowId: windowId,
      });

      if (!activeTab?.url) {
        logger.info("No active tab in focused window");
        await this.saveCurrentSession();
        await this.resetTrackingState();
        return;
      }

      const domain = getDomainFromUrl(activeTab.url);

      // Check if domain should be ignored
      if (isIgnoredDomain(domain)) {
        logger.info("Focused window has ignored domain:", { domain });
        await this.saveCurrentSession();
        await this.resetTrackingState();
        return;
      }

      // Save current session before switching
      await this.saveCurrentSession();

      // Start tracking the new active tab
      await this.startTracking(activeTab.url, domain, activeTab.favIconUrl);

      logger.info("Window focus changed, now tracking:", { url: activeTab.url });
    } catch (error) {
      logger.error("Failed to handle window focus change", error);
      // Don't throw - continue operation
    }
  }

  /**
   * Handles idle state changes.
   * Called when user becomes idle or active again.
   * @param isIdle - True if user is now idle, false if user is now active
   */
  async handleIdleState(isIdle: boolean): Promise<void> {
    try {
      const trackingState = await this.storageManager.getTrackingState();

      if (isIdle) {
        logger.info("User is now idle, saving session");
        // Save current session before going idle
        await this.saveCurrentSession();

        // Update state to mark as idle (preserve other state for resume)
        await this.storageManager.updateTrackingState({
          isIdle: true,
        });
      } else {
        logger.info("User is now active");

        // If there was a currentUrl being tracked before idle, resume tracking
        if (trackingState?.currentUrl) {
          const now = Date.now();
          await this.storageManager.updateTrackingState({
            isIdle: false,
            startTime: now,
            lastActiveTime: now,
          });
          logger.info("Resumed tracking after idle:", { url: trackingState.currentUrl });
        } else {
          // No previous tracking, just mark as not idle and start tracking active tab
          await this.storageManager.updateTrackingState({
            isIdle: false,
          });
          await this.startTrackingActiveTab();
        }
      }
    } catch (error) {
      logger.error("Failed to handle idle state change", error);
      // Don't throw - continue operation
    }
  }

  /**
   * Handles tab activation when user switches to a different tab.
   * Saves current session before switching and starts tracking the new tab.
   * @param tabId - The ID of the activated tab
   * @param windowId - The ID of the window containing the tab
   */
  async handleTabActivated(tabId: number, windowId: number): Promise<void> {
    try {
      // Save current session before switching
      await this.saveCurrentSession();

      // Get tab information
      const tab = await chrome.tabs.get(tabId);

      if (!tab?.url) {
        logger.info("Activated tab has no URL");
        return;
      }

      const domain = getDomainFromUrl(tab.url);

      // Check if domain should be ignored
      if (isIgnoredDomain(domain)) {
        logger.info("Ignoring activated domain:", { domain });
        await this.resetTrackingState();
        return;
      }

      // Start tracking the new tab
      await this.startTracking(tab.url, domain, tab.favIconUrl);

      logger.info("Tab activated, now tracking:", { url: tab.url });
    } catch (error) {
      logger.error("Failed to handle tab activation", error);
      // Don't throw - Chrome might have already closed the tab
    }
  }

  /**
   * Handles URL changes within the same tab (navigation).
   * Saves current session if URL changed and starts tracking the new URL.
   * @param tabId - The ID of the tab where URL changed
   * @param url - The new URL
   * @param windowId - The ID of the window containing the tab
   */
  async handleUrlChange(
    tabId: number,
    url: string,
    windowId: number
  ): Promise<void> {
    try {
      // Get current tracking state
      const trackingState = await this.storageManager.getTrackingState();

      // If same URL, nothing to do
      if (trackingState?.currentUrl === url) {
        return;
      }

      // Save current session before switching URLs
      await this.saveCurrentSession();

      const domain = getDomainFromUrl(url);

      // Check if domain should be ignored
      if (isIgnoredDomain(domain)) {
        logger.info("Ignoring URL change to domain:", { domain });
        await this.resetTrackingState();
        return;
      }

      // Start tracking the new URL
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      await this.startTracking(url, domain, tab?.favIconUrl);

      logger.info("URL changed, now tracking:", { url });
    } catch (error) {
      logger.error("Failed to handle URL change", error);
    }
  }

  /**
   * Saves the current tracking session to storage.
   * Calculates elapsed time and adds it to the current domain's time for today.
   * NO TIME CAP - key improvement over v1 which had a 30s limit.
   * Public method called by periodic alarm and before state changes.
   */
  async saveCurrentSession(): Promise<void> {
    try {
      const trackingState = await this.storageManager.getTrackingState();

      // Nothing to save if not tracking anything
      if (!trackingState?.currentUrl || !trackingState?.startTime) {
        return;
      }

      // Don't save if idle
      if (trackingState.isIdle) {
        logger.debug("Skipping save - user is idle");
        return;
      }

      const now = Date.now();
      const elapsedMs = now - trackingState.startTime;

      // Clock skew protection - don't save negative time
      if (elapsedMs < 0) {
        logger.warn("Negative elapsed time detected, skipping save");
        return;
      }

      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      // Only save if there's meaningful time (at least 1 second)
      if (elapsedSeconds < 1) {
        return;
      }

      const domain = getDomainFromUrl(trackingState.currentUrl);

      logger.info(`Saving ${elapsedSeconds}s for ${domain}`);

      // Add time to storage
      await this.storageManager.addTimeToCurrentDay(
        domain,
        elapsedSeconds,
        trackingState.favicon || undefined
      );

      // Update startTime to 'now' to prevent over-counting in next periodic save
      // This was a major bug in previous implementation
      await this.storageManager.updateTrackingState({
        startTime: now,
        lastActiveTime: now,
      });
    } catch (error) {
      logger.error("Failed to save current session", error);
      // Don't throw - this is a best-effort operation
    }
  }

  /**
   * Resets the tracking state to a clean slate.
   */
  private async resetTrackingState(): Promise<void> {
    const cleanState: TrackingState = {
      currentUrl: null,
      startTime: null,
      lastActiveTime: null,
      isIdle: false,
      favicon: null,
    };

    await this.storageManager.setTrackingState(cleanState);
  }

  /**
   * Sets up the periodic save alarm.
   * Creates an alarm that fires every 0.25 minutes (15 seconds).
   */
  private async setupPeriodicSaveAlarm(): Promise<void> {
    // Clear existing alarm first to avoid duplicates
    await chrome.alarms.clear(ALARM_NAMES.SAVE_DATA);

    // Create new periodic alarm
    await chrome.alarms.create(ALARM_NAMES.SAVE_DATA, {
      periodInMinutes: 0.25, // 15 seconds
    });

    logger.info("Periodic save alarm created");
  }

  /**
   * Starts tracking the currently active tab if it's valid.
   */
  private async startTrackingActiveTab(): Promise<void> {
    try {
      // Query for the active tab in the current window
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!activeTab?.url) {
        logger.info("No active tab found or tab has no URL");
        return;
      }

      const domain = getDomainFromUrl(activeTab.url);

      // Check if domain should be ignored
      if (isIgnoredDomain(domain)) {
        logger.info("Ignoring domain:", { domain });
        return;
      }

      // Start tracking this tab
      await this.startTracking(activeTab.url, domain, activeTab.favIconUrl);

      logger.info("Started tracking active tab:", { url: activeTab.url });
    } catch (error) {
      logger.error("Failed to start tracking active tab", error);
      // Don't throw - this is a best-effort operation
    }
  }

  /**
   * Starts tracking a new URL.
   * Updates tracking state with new URL and resets startTime.
   * Optionally fetches and saves favicon (fire-and-forget).
   * @param url - The URL to start tracking
   * @param domain - The domain extracted from the URL
   * @param favicon - Optional favicon URL from the tab
   */
  private async startTracking(
    url: string,
    domain: string,
    favicon?: string
  ): Promise<void> {
    try {
      const now = Date.now();

      // Update tracking state
      await this.storageManager.setTrackingState({
        currentUrl: url,
        startTime: now,
        lastActiveTime: now,
        isIdle: false,
        favicon: favicon || null,
      });

      // Fetch and save favicon (fire-and-forget, don't await)
      if (favicon) {
        this.storageManager.updateFavicon(domain, favicon).catch((error) => {
          logger.warn(`Failed to update favicon for ${domain}`, error);
        });
      } else {
        this.fetchAndSaveFavicon(domain).catch((error) => {
          logger.warn(`Failed to fetch favicon for ${domain}`, error);
        });
      }

      logger.debug(`Tracking session started: ${url}`);
    } catch (error) {
      logger.error("Failed to start tracking", error);
      throw error;
    }
  }

  /**
   * Fetches and saves the favicon for a domain.
   * This is a fire-and-forget operation called from startTracking.
   * @param domain - The domain to fetch favicon for
   */
  private async fetchAndSaveFavicon(domain: string): Promise<void> {
    try {
      // First try to find an active tab for this domain to get its favicon
      const tabs = await chrome.tabs.query({ url: `*://${domain}/*` });
      const tabWithFavicon = tabs.find((t) => t.favIconUrl);

      if (tabWithFavicon?.favIconUrl) {
        await this.storageManager.updateFavicon(domain, tabWithFavicon.favIconUrl);
        return;
      }

      // Fallback to Chrome's favicon service
      const faviconUrl = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=https://${domain}&size=32`;
      await this.storageManager.updateFavicon(domain, faviconUrl);
    } catch (error) {
      logger.error(`Failed to fetch favicon for ${domain}`, error);
    }
  }
}
