// background.ts

// Interface to store tracking information
interface TabTracking {
  [tabId: number]: {
    url: string
    startTime: number
  }
}

// Interface to store time spent per website
interface TimeSpentData {
  [url: string]: number
}

// Object to keep track of active tabs and their start times
const tabTracking: TabTracking = {}
let currentTabId: number | null = null
let currentTabUrl: string = "unknown" // To store the URL of the current tab

// Helper function to get current timestamp
const getCurrentTime = (): number => Date.now()

// Helper function to get a valid URL from tab
const getValidUrl = (url: string | undefined): string => {
  try {
    return new URL(url || "").hostname
  } catch (e) {
    console.error("Invalid URL:", url)
    return "unknown"
  }
}

// Helper function to format time spent
const formatTimeSpent = (timeSpent: number, url: string): string => {
  const seconds = Math.floor(timeSpent / 1000)
  return `${seconds} seconds spent on ${url}`
}

// Function to record the time spent on a website
const recordTimeSpent = (tabId: number) => {
  const trackingInfo = tabTracking[tabId]
  if (trackingInfo) {
    const timeSpent = getCurrentTime() - trackingInfo.startTime
    chrome.storage.local.get(["timeSpent"], (result) => {
      const timeSpentData: TimeSpentData = result.timeSpent || {}
      if (!timeSpentData[trackingInfo.url]) {
        timeSpentData[trackingInfo.url] = 0
      }
      timeSpentData[trackingInfo.url] += timeSpent
      chrome.storage.local.set({ timeSpent: timeSpentData })

      // Log the time spent in a human-readable format with the URL
      console.log(formatTimeSpent(timeSpent, trackingInfo.url))
    })
    delete tabTracking[tabId] // Clean up after recording
  }
}

// Start tracking time when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (currentTabId !== null) {
      recordTimeSpent(currentTabId)
    }
    // Start tracking the new tab
    const url = getValidUrl(tab.url)
    tabTracking[tabId] = {
      url,
      startTime: getCurrentTime()
    }
    if (tabId === currentTabId) {
      currentTabUrl = url
    }
  }
})

// Record time spent when a tab is activated
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (currentTabId !== null) {
    recordTimeSpent(currentTabId)
  }
  // Update currentTabId and start tracking the new tab
  currentTabId = activeInfo.tabId
  chrome.tabs.get(currentTabId, (tab) => {
    currentTabUrl = getValidUrl(tab.url) // Update currentTabUrl
    tabTracking[currentTabId] = {
      url: currentTabUrl,
      startTime: getCurrentTime()
    }
  })
})

// Record time spent when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === currentTabId) {
    recordTimeSpent(tabId)
    currentTabId = null // Clear currentTabId if the current tab is closed
    currentTabUrl = "unknown" // Clear currentTabUrl if the current tab is closed
  } else {
    recordTimeSpent(tabId)
  }
})

// Record time spent when the window loses focus
chrome.windows.onFocusChanged.addListener(() => {
  if (currentTabId !== null) {
    recordTimeSpent(currentTabId)
  }
})

// On extension start, check and reinitialize tracking if needed
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["timeSpent"], (result) => {
    if (!result.timeSpent) {
      chrome.storage.local.set({ timeSpent: {} })
    }
  })
})

// Initialize currentTabId on extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentTabId = tabs[0].id || null
      currentTabUrl = getValidUrl(tabs[0].url) // Initialize currentTabUrl
    }
  })
})
// background.ts

// Helper function to check if a URL is YouTube
const isYouTube = (url: string | undefined): boolean => {
  try {
    const parsedUrl = new URL(url || "")
    return (
      parsedUrl.hostname === "www.youtube.com" ||
      parsedUrl.hostname === "youtube.com"
    )
  } catch (e) {
    console.error("Invalid URL:", url)
    return false
  }
}

// Function to create a notification
const createNotification = (url: string | undefined) => {
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "icon.png", // Ensure this path is correct and the file exists
      title: "Tab Closed",
      message: `The tab with URL ${url} was closed because it was blocked.`,
      priority: 2
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("Notification error:", chrome.runtime.lastError.message)
      } else {
        console.log("Notification created with ID:", notificationId)
      }
    }
  )
}

// Event listener for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (isYouTube(tab.url)) {
      console.log(`Closing tab with YouTube URL: ${tab.url}`)
      chrome.tabs.remove(tabId, () => {
        console.log(`Tab ${tabId} closed due to YouTube URL.`)
        createNotification(tab.url) // Create notification after tab is closed
      })
    }
  }
})
