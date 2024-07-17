import { getWeekNumber } from "@/lib/functions"

import { validateTokenAndFetchData } from "./auth"
import { syncLocalDataWithBackend } from "./sync"
import { handleTabChange, updateScreenTime } from "./tracking"

let currentUrl = ""
let startTime = 0
let favicon = undefined
const userId = 1

const IGNORED_DOMAINS = ["newtab", "extensions", "localhost", "settings"]

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed")
  await chrome.storage.local.get(["screenTimeData"], (result) => {
    console.log("ScreenTimeData:", result.screenTimeData)
  })
  validateTokenAndFetchData()
  chrome.alarms.create("syncData", { periodInMinutes: 10 })
  chrome.alarms.create("updateCurrentTabScreenTime", {
    periodInMinutes: 1
  })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncData") {
    console.log("Alarm triggered: syncData")
    syncLocalDataWithBackend(userId)
  } else if (alarm.name === "updateCurrentTabScreenTime") {
    if (currentUrl && startTime > Date.now() - 1000 * 60 * 2) {
      updateCurrentTabScreenTime()
      startTime = Date.now()
    }
  }
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    await isBlocked(new URL(tab.url).hostname, tabId, tab)
    updateTabInfo(tab)
  }
})

chrome.windows.onRemoved.addListener(async (windowId) => {
  chrome.windows.getAll((windows) => {
    if (windows.length === 0 && currentUrl) {
      console.log("All browser windows closed")
      const endTime = Date.now()
      const timeSpent = Math.round((endTime - startTime) / 1000)
      updateScreenTime(new URL(currentUrl).hostname, timeSpent, favicon)
      resetTabInfo()
    }
  })
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    if (tab.url) {
      await isBlocked(new URL(tab.url).hostname, activeInfo.tabId, tab)
      console.log("Tab activated:", tab.url)
      updateTabInfo(tab)
    }
  })
})

function updateCurrentTabScreenTime() {
  if (currentUrl) {
    console.log("Updating current tab screen time: ", currentUrl)
    const endTime = Date.now()
    const timeSpent = Math.round((endTime - startTime) / 1000)
    updateScreenTime(new URL(currentUrl).hostname, timeSpent, favicon)
  }
}

function updateTabInfo(tab) {
  const url = new URL(tab.url)
  const domain = url.hostname

  if (IGNORED_DOMAINS.some((ignored) => domain.includes(ignored))) {
    console.log(`Ignoring domain: ${domain}`)
    // Update screen time for the previous tab
    updateCurrentTabScreenTime()
    resetTabInfo()
    return
  }

  const result = handleTabChange(tab.url, currentUrl, startTime, favicon)
  currentUrl = result.currentUrl
  startTime = result.startTime

  // Retry mechanism for favicon
  if (!tab.favIconUrl) {
    retryFetchFavicon(tab.id, 5) // Retry up to 5 times
  } else {
    console.log("Tab favicon:", tab.favIconUrl)
    favicon = tab.favIconUrl
  }
}

function retryFetchFavicon(tabId, retries) {
  if (retries <= 0) return

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

function resetTabInfo() {
  currentUrl = ""
  startTime = 0
  favicon = undefined
}

async function isBlocked(domain: string, tabId: number, tab: chrome.tabs.Tab) {
  const blockedDomains = await chrome.storage.sync.get("blockedDomains")
  const blockedDomainList = blockedDomains.blockedDomains || []
  if (blockedDomainList.includes(domain)) {
    console.log("Tab is blocked:", tab.url)
    retryRemoveTab(tabId)
  }
}

function retryRemoveTab(tabId, retries = 5) {
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
