import { getDataKey } from "@/lib/functions";
import { ScreenTimeData, TabChangeResult } from "@/types/types";

let currentUrl = "";
let startTime = 0;
let favicon: string | undefined;
let currentTabId: number | undefined; // Track active tab ID

const IGNORED_DOMAINS = new Set([
  "newtab",
  "extensions",
  "localhost",
  "settings",
]);

// Helper function to check ignored domains
function isIgnored(url: URL): boolean {
  const { hostname, pathname } = url;
  return (
    IGNORED_DOMAINS.has(hostname) || IGNORED_DOMAINS.has(pathname.split("/")[1])
  );
}

// Set up alarms on installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed");
  chrome.alarms.clearAll(() => {
    chrome.alarms.create("updateCurrentTabScreenTime", {
      periodInMinutes: 0.5,
    });
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "updateCurrentTabScreenTime") {
    await updateCurrentTabScreenTime();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  setTimeout(async () => {
    await updateCurrentTabScreenTime();
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      resetTabInfo();
    } else {
      chrome.tabs.query({ active: true, windowId }, (tabs) => {
        if (tabs[0]) {
          updateTabInfo(tabs[0]);
        }
      });
    }
  }, 100);
});

// Tab closure
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId !== currentTabId) {
    return;
  }

  // Capture data before reset
  const urlToUpdate = currentUrl;
  const startToUpdate = startTime;
  const faviconToUpdate = favicon;

  resetTabInfo();

  if (urlToUpdate) {
    await updateScreenTimeForUrl(urlToUpdate, startToUpdate, faviconToUpdate);
  }
});

// Handle extension suspend
chrome.runtime.onSuspend.addListener(async () => {
  await updateCurrentTabScreenTime();
});

// Tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  currentTabId = activeInfo.tabId;
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    if (tab?.url) {
      await updateCurrentTabScreenTime();
      await isBlocked(new URL(tab.url).hostname, activeInfo.tabId);
      updateTabInfo(tab);
    }
  });
});

// Tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    isBlocked(new URL(tab.url).hostname, tabId);
  }
});

// Reset tracking info
function resetTabInfo() {
  currentUrl = "";
  startTime = 0;
  favicon = undefined;
  currentTabId = undefined;
}

// Update tab info
async function updateTabInfo(tab: chrome.tabs.Tab) {
  if (!tab.url || !tab.id) {
    return;
  }
  currentTabId = tab.id;

  const url = new URL(tab.url);
  if (isIgnored(url)) {
    await updateCurrentTabScreenTime();
    resetTabInfo();
    return;
  }

  const result = handleTabChange(tab.url, currentUrl, favicon);
  if (!result) {
    return;
  }

  currentUrl = result.currentUrl;
  startTime = result.startTime;
  favicon = tab.favIconUrl || (await fetchFaviconWithRetry(tab.id));
}

// Fetch favicon with retry
async function fetchFaviconWithRetry(
  tabId: number,
  retries = 3
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const attempt = (remaining: number) => {
      chrome.tabs.get(tabId, (tab) => {
        if (tab?.favIconUrl) {
          return resolve(tab.favIconUrl);
        }
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), 1000);
        } else {
          resolve(undefined);
        }
      });
    };
    attempt(retries);
  });
}

// Update screen time with parameters
async function updateScreenTimeForUrl(
  url: string,
  start: number,
  favicon?: string
) {
  if (!url) {
    return;
  }

  try {
    const endTime = Date.now();
    const timeSpent = Math.round((endTime - start) / 1000);
    if (timeSpent < 1) {
      return;
    }

    const domain = new URL(url).hostname;
    const now = new Date();
    const key = getDataKey(now);
    const dateStr = now.toLocaleDateString("en-CA");

    chrome.storage.local.get(["screenTimeData"], (result) => {
      const screenTimeData: ScreenTimeData = result.screenTimeData || {};
      const weekData = screenTimeData[key] || {};
      const dateData = weekData[dateStr] || {};

      dateData[domain] = {
        time: (dateData[domain]?.time || 0) + timeSpent,
        favicon: favicon || dateData[domain]?.favicon,
      };

      weekData[dateStr] = dateData;
      screenTimeData[key] = weekData;

      chrome.storage.local.set({ screenTimeData });
    });
  } catch (error) {
    console.error("Error updating screen time:", error);
  }
}

// Update current tab's screen time
async function updateCurrentTabScreenTime() {
  if (!currentUrl || !currentTabId) {
    return;
  }
  await updateScreenTimeForUrl(currentUrl, startTime, favicon);
  startTime = Date.now(); // Reset start time after update
}

// Handle tab URL changes
function handleTabChange(
  newUrl: string,
  currentUrl: string,
  favicon?: string
): TabChangeResult | null {
  return newUrl !== currentUrl
    ? {
        currentUrl: newUrl,
        startTime: Date.now(),
        favicon,
      }
    : null;
}

// Domain blocking
async function isBlocked(domain: string, tabId: number) {
  const { blockedDomains = [] } = await chrome.storage.local.get(
    "blockedDomains"
  );
  if (blockedDomains.includes(domain)) {
    chrome.tabs.remove(tabId).catch(() => retryRemoveTab(tabId));
  }
}

// Retry tab removal
function retryRemoveTab(tabId: number, retries = 3) {
  if (retries <= 0) {
    return;
  }
  chrome.tabs.remove(tabId, () => {
    if (chrome.runtime.lastError) {
      setTimeout(() => retryRemoveTab(tabId, retries - 1), 500);
    }
  });
}
