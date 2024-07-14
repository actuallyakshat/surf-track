import { validateTokenAndFetchData } from "./auth"
import { syncLocalDataWithBackend } from "./sync"
import { handleTabChange, updateScreenTime } from "./tracking"

let currentUrl = ""
let startTime = 0
let favicon: string | undefined = undefined
const userId = 1 // Assuming you get the userId after validating the token

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed")
  validateTokenAndFetchData()
  chrome.alarms.create("syncData", { periodInMinutes: 10 })
  chrome.alarms.create("updateCurrentTabScreenTime", {
    periodInMinutes: 5
  })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncData") {
    //Sync local data with backend every 10 minutes
    console.log("Alarm triggered: syncData")
    syncLocalDataWithBackend(userId)
  } else if (alarm.name === "updateCurrentTabScreenTime") {
    //If the current tab is active and the time spent is more than 5 minutes, update the current tab screen time
    if (currentUrl && startTime > Date.now() - 1000 * 60 * 5) {
      updateCurrentTabScreenTime()
      startTime = Date.now()
    }
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("Tab updated:", tab.url)
    const result = handleTabChange(tab.url, currentUrl, startTime, favicon)
    currentUrl = result.currentUrl
    startTime = result.startTime
    favicon = tab.favIconUrl || undefined
  }
})

chrome.windows.onRemoved.addListener((windowId) => {
  chrome.windows.getAll((windows) => {
    if (windows.length === 0 && currentUrl) {
      console.log("All browser windows closed")
      const endTime = Date.now()
      const timeSpent = Math.round((endTime - startTime) / 1000)
      updateScreenTime(new URL(currentUrl).hostname, timeSpent, favicon)
      currentUrl = ""
      startTime = 0
      favicon = undefined
    }
  })
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      console.log("Tab:", tab)
      console.log("Tab activated:", tab.url)
      const result = handleTabChange(tab.url, currentUrl, startTime, favicon)
      currentUrl = result.currentUrl
      startTime = result.startTime
      favicon = tab.favIconUrl || undefined
    }
  })
})

function updateCurrentTabScreenTime() {
  if (currentUrl) {
    console.log("Updating current tab screen time: ", currentUrl)
    const endTime = Date.now()
    const timeSpent = Math.round((endTime - startTime) / 1000)
    updateScreenTime(currentUrl, timeSpent, favicon)
  }
}
