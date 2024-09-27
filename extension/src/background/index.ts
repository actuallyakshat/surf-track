import { handleTabChange, updateScreenTime } from "./tracking"

// Global variables
let currentUrl = ""
let startTime = 0
let favicon: string | undefined = undefined
let isWindowFocused = true
let isSystemActive = true

const IGNORED_DOMAINS = ["newtab", "extensions", "localhost", "settings"]
const IDLE_DETECTION_INTERVAL = 1800 // 30 minutes in seconds

// Fetching data from the storage on initial load
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed")
  await chrome.storage.local.get(["screenTimeData"], (result) => {
    console.log("ScreenTimeData:", result.screenTimeData)
  })

  // Set up periodic screen time updates
  chrome.alarms.create("updateCurrentTabScreenTime", { periodInMinutes: 1 })

  // Set up idle detection if the API is available
  if (chrome.idle) {
    chrome.idle.setDetectionInterval(IDLE_DETECTION_INTERVAL)
    setupIdleListeners()
  } else {
    console.warn(
      "chrome.idle API is not available. Idle detection will not function."
    )
  }
})

// Set up idle listeners if the API is available
function setupIdleListeners() {
  if (chrome.idle) {
    chrome.idle.onStateChanged.addListener(async (state) => {
      console.log("System state changed to:", state)
      if (state === "active") {
        if (!isSystemActive) {
          // System was inactive and is now active
          isSystemActive = true
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              updateTabInfo(tabs[0])
            }
          })
        }
      } else if (state === "locked") {
        // System is locked
        isSystemActive = false
        await updateCurrentTabScreenTime()
      } else if (state === "idle") {
        // System has been idle for the set detection interval
        // We'll continue tracking but flag this period as potentially inactive
        console.log(
          "System idle for extended period. Continuing to track but flagging as potentially inactive."
        )
        // Here you could implement additional logic to flag this period or handle it differently
      }
    })
  }
}

// Listening for alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "updateCurrentTabScreenTime") {
    await updateCurrentTabScreenTime()
  }
})

// Listening for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && isSystemActive) {
    try {
      await isBlocked(new URL(tab.url).hostname, tabId, tab)
      await updateTabInfo(tab)
    } catch (error) {
      console.error("Error handling tab update:", error)
    }
  }
})

// Listening for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Window lost focus
    isWindowFocused = false
    await updateCurrentTabScreenTime()
  } else {
    // Window gained focus
    isWindowFocused = true
    if (isSystemActive) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          updateTabInfo(tabs[0])
        }
      })
    }
  }
})

// Listening for tab activations
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (isSystemActive) {
    chrome.tabs.get(activeInfo.tabId, async (tab) => {
      if (tab.url) {
        await isBlocked(new URL(tab.url).hostname, activeInfo.tabId, tab)
        console.log("Tab activated:", tab.url)
        updateTabInfo(tab)
      }
    })
  }
})

// Function to update the current tab's screen time
async function updateCurrentTabScreenTime() {
  if (currentUrl && isSystemActive) {
    console.log("Updating current tab screen time: ", currentUrl)
    const endTime = Date.now()
    const timeSpent = Math.round((endTime - startTime) / 1000)
    try {
      await updateScreenTime(new URL(currentUrl).hostname, timeSpent, favicon)
      startTime = endTime // Reset start time to current time
    } catch (error) {
      console.error("Error updating screen time:", error)
    }
  }
}

// Function to update the tab info
async function updateTabInfo(tab: chrome.tabs.Tab) {
  if (!isSystemActive || !tab.url) return

  const url = new URL(tab.url)
  const domain = url.hostname

  if (IGNORED_DOMAINS.some((ignored) => domain.includes(ignored))) {
    console.log(`Ignoring domain: ${domain}`)
    await updateCurrentTabScreenTime()
    resetTabInfo()
    return
  }

  const result = handleTabChange(tab.url, currentUrl, startTime, favicon)
  currentUrl = result?.currentUrl || ""
  startTime = result?.startTime || 0

  if (!tab.favIconUrl) {
    retryFetchFavicon(tab.id, 5)
  } else {
    console.log("Tab favicon:", tab.favIconUrl)
    favicon = tab.favIconUrl
  }
}

// Function to retry fetching the favicon
function retryFetchFavicon(tabId: number | undefined, retries: number) {
  if (!tabId || retries <= 0) return

  setTimeout(() => {
    chrome.tabs.get(tabId, (tab) => {
      if (tab && tab.favIconUrl) {
        favicon = tab.favIconUrl
      } else if (retries > 1) {
        retryFetchFavicon(tabId, retries - 1)
      }
    })
  }, 1000) // Retry every 1s
}

// Utility Function to reset the tab info
function resetTabInfo() {
  currentUrl = ""
  startTime = 0
  favicon = undefined
}

// Function to check if the url of the current tab is blocked
async function isBlocked(domain: string, tabId: number, tab: chrome.tabs.Tab) {
  const blockedDomains = await chrome.storage.local.get("blockedDomains")
  console.log("Blocked domains:", blockedDomains)
  const blockedDomainList: string[] = blockedDomains.blockedDomains || []
  console.log("Blocked domains List:", blockedDomainList)
  if (blockedDomainList.includes(domain)) {
    console.log("Tab is blocked:", tab.url)
    await retryRemoveTab(tabId)
  }
}

// Function to retry removing the tab
function retryRemoveTab(tabId: number, retries = 5) {
  if (retries <= 0) {
    console.error(`Failed to remove tab ${tabId} after multiple attempts`)
    return
  }

  chrome.tabs.remove(tabId, () => {
    if (chrome.runtime.lastError) {
      console.warn(
        `Retrying to remove tab ${tabId}: ${chrome.runtime.lastError.message}`
      )
      setTimeout(() => retryRemoveTab(tabId, retries - 1), 500) // Retry after 500ms
    } else {
      console.log(`Tab ${tabId} removed successfully`)
    }
  })
}
