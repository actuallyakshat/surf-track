/**
 * Main Service Worker for Surf Track Chrome Extension
 *
 * This file serves as the entry point for the background service worker.
 * It initializes all tracking services and sets up event listeners for:
 * - Tab changes and URL updates
 * - Window focus changes
 * - Periodic data saves
 * - Data archiving
 * - Idle state detection
 */

import { ALARM_NAMES } from "../lib/constants"
import { DataArchiver } from "./data-archiver"
import { IdleDetector } from "./idle-detector"
import { Logger } from "./logger"
import { StorageManager } from "./storage-manager"
import { TrackingEngine } from "./tracking-engine"

const logger = new Logger("ServiceWorker")

// Initialize service instances
const storageManager = StorageManager.getInstance()
const trackingEngine = new TrackingEngine(storageManager)
const idleDetector = IdleDetector.getInstance()
const dataArchiver = DataArchiver.getInstance()

/**
 * Service Worker Initialization
 * Runs every time the service worker script executes
 */
async function initializeServiceWorker() {
  try {
    logger.info("Initializing service worker")

    // Start idle detector with callback
    idleDetector.start({
      onStateChange: (isIdle: boolean) => {
        logger.info("Idle state changed", { isIdle })
        trackingEngine.handleIdleState(isIdle).catch((error) => {
          logger.error("Error handling idle state change", error)
        })
      }
    })

    // Resume tracking from previous state
    await trackingEngine.resume()

    // Start data archiver (sets up daily archiving alarm)
    dataArchiver.start()

    logger.info("Service worker initialized successfully")
  } catch (error) {
    logger.error("Failed to initialize service worker", error)
  }
}

// Kick off initialization
initializeServiceWorker()

/**
 * Extension Installation Handler
 * Runs when the extension is first installed or updated
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    logger.info("Extension installed/updated", { reason: details.reason })

    // Initialize tracking engine from clean slate
    await trackingEngine.initialize()

    logger.info("onInstalled handling complete")
  } catch (error) {
    logger.error("Error during installation", error)
  }
})

/**
 * Browser Startup Handler
 * Runs when Chrome starts
 */
chrome.runtime.onStartup.addListener(async () => {
  logger.info("Browser startup detected")
})

/**
 * Tab Activation Handler
 * Fires when user switches to a different tab
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    logger.debug("Tab activated", {
      tabId: activeInfo.tabId,
      windowId: activeInfo.windowId
    })
    await trackingEngine.handleTabActivated(
      activeInfo.tabId,
      activeInfo.windowId
    )
  } catch (error) {
    logger.error("Error handling tab activation", error)
  }
})

/**
 * Tab Update Handler
 * Fires when a tab's URL changes or page finishes loading
 * Only processes active tabs to avoid tracking background tab navigations
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    // Only process active tabs - ignore background tab navigations
    if (!tab.active) {
      return
    }

    // Process when URL is available (covers navigation start and finish)
    if (changeInfo.url) {
      logger.debug("Tab URL updated", {
        tabId,
        url: changeInfo.url,
        windowId: tab.windowId
      })
      await trackingEngine.handleUrlChange(tabId, changeInfo.url, tab.windowId)
    } else if (changeInfo.status === "complete" && tab.url) {
      // Also catch complete status if we missed the URL change
      logger.debug("Tab load complete", {
        tabId,
        url: tab.url,
        windowId: tab.windowId
      })
      await trackingEngine.handleUrlChange(tabId, tab.url, tab.windowId)
    }
  } catch (error) {
    logger.error("Error handling tab update", error)
  }
})

/**
 * Window Focus Change Handler
 * Fires when user switches between browser windows or focuses away from Chrome
 */
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  try {
    await trackingEngine.handleWindowFocusChange(windowId)
  } catch (error) {
    logger.error("Error handling window focus change", error)
  }
})

/**
 * Alarm Handler
 * Processes periodic alarms for data saving
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    // Periodic save alarm (fires every 15 seconds)
    if (alarm.name === ALARM_NAMES.SAVE_DATA) {
      await trackingEngine.saveCurrentSession()
      return
    }
  } catch (error) {
    logger.error(`Error handling alarm '${alarm.name}'`, error)
  }
})

/**
 * Message Handler
 * Processes messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RETRY_FAVICON") {
    const { domain } = message
    if (domain) {
      trackingEngine
        .retryFetchFavicon(domain)
        .then(() => {
          logger.info(`Favicon retry initiated for ${domain}`)
        })
        .catch((error) => {
          logger.error(`Failed to retry favicon for ${domain}`, error)
        })
    }
  }
})

logger.info("Service worker script loaded")
