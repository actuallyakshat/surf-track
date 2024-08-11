import { handleTabChange, updateScreenTime } from "./tracking"

let currentUrl = ""
let startTime = 0
let favicon = undefined
let isWindowFocused = true

const IGNORED_DOMAINS = ["newtab", "extensions", "localhost", "settings"]

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed")
  await chrome.storage.local.get(["screenTimeData"], (result) => {
    console.log("ScreenTimeData:", result.screenTimeData)
  })

  // chrome.alarms.create("syncData", { periodInMinutes: 10 })
  chrome.alarms.create("updateCurrentTabScreenTime", { periodInMinutes: 1 })
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "syncData") {
    //TODO: Implement syncing data
    // await chrome.storage.local.get(["screenTimeData"], async (data) => {
    //   if (data.screenTimeData) {
    //     const currentWeekNumber = getWeekNumber(new Date())
    //     if (data[currentWeekNumber].synced === false) {
    //       console.log("Alarm triggered: syncData")
    //       console.log("Syncing data")
    //       await syncPreviousDataWithBackend(currentWeekNumber, data)
    //     }
    //   }
    // })
  } else if (alarm.name === "updateCurrentTabScreenTime") {
    await updateCurrentTabScreenTime()
  }
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    try {
      await isBlocked(new URL(tab.url).hostname, tabId, tab)
      await updateTabInfo(tab)
    } catch (error) {
      console.error("Error handling tab update:", error)
    }
  }
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Window lost focus
    isWindowFocused = false
    await updateCurrentTabScreenTime()
  } else {
    // Window gained focus
    isWindowFocused = true
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        updateTabInfo(tabs[0])
      }
    })
  }
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

async function updateCurrentTabScreenTime() {
  if (currentUrl) {
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

async function updateTabInfo(tab) {
  const url = new URL(tab.url)
  const domain = url.hostname

  if (IGNORED_DOMAINS.some((ignored) => domain.includes(ignored))) {
    console.log(`Ignoring domain: ${domain}`)
    await updateCurrentTabScreenTime()
    resetTabInfo()
    return
  }

  const result = handleTabChange(tab.url, currentUrl, startTime, favicon)
  currentUrl = result?.currentUrl
  startTime = result?.startTime

  if (!tab.favIconUrl) {
    retryFetchFavicon(tab.id, 5)
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

async function isBlocked(domain, tabId, tab) {
  const blockedDomains = await chrome.storage.local.get("blockedDomains")
  console.log("Blocked domains:", blockedDomains)
  const blockedDomainList = blockedDomains.blockedDomains || []
  console.log("Blocked domains List:", blockedDomainList)
  if (blockedDomainList.includes(domain)) {
    console.log("Tab is blocked:", tab.url)
    await retryRemoveTab(tabId)
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
