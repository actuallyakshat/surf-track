import { getDataKey } from "@/lib/functions";
import { ScreenTimeData, TabChangeResult } from "@/types/types";

let currentUrl = "";
let startTime = 0;
let favicon: string | undefined;
let currentTabId: number | undefined;

const IGNORED_DOMAINS = new Set([
  "newtab",
  "extensions",
  "localhost",
  "settings",
  "about:blank",
]);

const MAX_TIME_SPENT = 30;

function isIgnored(url: URL): boolean {
  const { hostname, pathname } = url;
  return (
    IGNORED_DOMAINS.has(hostname) || IGNORED_DOMAINS.has(pathname.split("/")[1])
  );
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed");
  chrome.alarms.clearAll(() => {
    chrome.alarms.create("updateCurrentTabScreenTime", {
      periodInMinutes: 0.25,
    });
    console.log("Alarm created");
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "updateCurrentTabScreenTime") {
    console.log("Alarm triggered");
    await updateCurrentTabScreenTime();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  console.log("Window focus changed:", windowId);
  setTimeout(async () => {
    await updateCurrentTabScreenTime();
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      console.log("No window focused, resetting tab info");
      resetTabInfo();
    } else {
      chrome.tabs.query({ active: true, windowId }, (tabs) => {
        if (tabs[0]) {
          console.log("Active tab found, updating tab info");
          updateTabInfo(tabs[0]);
        } else {
          console.log("No active tab found in focused window");
        }
      });
    }
  }, 100);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  console.log("Tab removed:", tabId);
  if (tabId === currentTabId) {
    const urlToUpdate = currentUrl;
    const startToUpdate = startTime;
    const faviconToUpdate = favicon;
    resetTabInfo();
    if (urlToUpdate) {
      console.log("Updating screen time for removed tab:", urlToUpdate);
      await updateScreenTimeForUrl(urlToUpdate, startToUpdate, faviconToUpdate);
    }
  }
});

chrome.runtime.onSuspend.addListener(async () => {
  console.log("Extension suspended");
  await updateCurrentTabScreenTime();
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab activated:", activeInfo.tabId);
  currentTabId = activeInfo.tabId;
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    if (tab?.url) {
      console.log("Tab URL found:", tab.url);
      await updateCurrentTabScreenTime();
      await isBlocked(new URL(tab.url).hostname, activeInfo.tabId);
      updateTabInfo(tab);
    } else {
      console.log("No URL found for activated tab");
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("Tab updated:", tabId, tab.url);
    isBlocked(new URL(tab.url).hostname, tabId);
    if (currentTabId === tabId) {
      updateTabInfo(tab);
    }
  }
});

function resetTabInfo() {
  console.log("Resetting tab info");
  currentUrl = "";
  startTime = 0;
  favicon = undefined;
}

async function updateTabInfo(tab: chrome.tabs.Tab) {
  if (!tab.url || !tab.id) {
    console.log("Tab has no URL or ID, returning");
    return;
  }
  currentTabId = tab.id;

  const url = new URL(tab.url);
  if (isIgnored(url)) {
    console.log("URL is ignored:", url.href);
    await updateCurrentTabScreenTime();
    resetTabInfo();
    return;
  }

  const result = handleTabChange(tab.url, currentUrl, favicon);
  if (result) {
    console.log("Tab change handled:", result);
    currentUrl = result.currentUrl;
    startTime = result.startTime;
    favicon = tab.favIconUrl || (await fetchFaviconWithRetry(tab.id));
  }
}

async function fetchFaviconWithRetry(
  tabId: number,
  retries = 3
): Promise<string | undefined> {
  console.log("Fetching favicon for tab:", tabId);
  return new Promise((resolve) => {
    const attempt = (remaining: number) => {
      chrome.tabs.get(tabId, (tab) => {
        if (tab?.favIconUrl) {
          console.log("Favicon found:", tab.favIconUrl);
          resolve(tab.favIconUrl);
        } else if (remaining > 0) {
          console.log(
            "Retrying favicon fetch, remaining retries:",
            remaining - 1
          );
          setTimeout(() => attempt(remaining - 1), 1000);
        } else {
          console.log("Favicon fetch failed after multiple retries");
          resolve(undefined);
        }
      });
    };
    attempt(retries);
  });
}

async function updateScreenTimeForUrl(
  url: string,
  start: number,
  favicon?: string
) {
  if (!url) return;
  const endTime = Date.now();
  const elapsed = endTime - start;
  let timeSpent = Math.round(elapsed / 1000);

  // Cap the time spent to the maximum allowed
  if (timeSpent > MAX_TIME_SPENT) {
    timeSpent = MAX_TIME_SPENT;
  }
  if (timeSpent < 1) return;

  const domain = new URL(url).hostname;
  const now = new Date();
  const key = getDataKey(now);
  const dateStr = now.toLocaleDateString("en-CA");

  console.log("Updating screen time for:", domain, timeSpent, dateStr);

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
    chrome.storage.local.set({ screenTimeData }, () => {
      console.log("Screen time data updated in storage");
    });
  });
}

async function updateCurrentTabScreenTime() {
  console.log("Updating current tab screen time");
  if (!currentUrl || !currentTabId) {
    console.log("No current URL or tab ID, returning");
    return;
  }
  await updateScreenTimeForUrl(currentUrl, startTime, favicon);
  startTime = Date.now();
}

function handleTabChange(
  newUrl: string,
  currentUrl: string,
  favicon?: string
): TabChangeResult | null {
  return newUrl !== currentUrl
    ? { currentUrl: newUrl, startTime: Date.now(), favicon }
    : null;
}

async function isBlocked(domain: string, tabId: number) {
  const { blockedDomains = [] } = await chrome.storage.local.get(
    "blockedDomains"
  );
  if (blockedDomains.includes(domain)) {
    console.log("Domain is blocked:", domain, "Removing tab:", tabId);
    chrome.tabs.remove(tabId).catch(() => retryRemoveTab(tabId));
  }
}

function retryRemoveTab(tabId: number, retries = 3) {
  if (retries <= 0) {
    console.log("Failed to remove tab after multiple retries:", tabId);
    return;
  }
  chrome.tabs.remove(tabId, () => {
    if (chrome.runtime.lastError) {
      console.log("Error removing tab, retrying:", chrome.runtime.lastError);
      setTimeout(() => retryRemoveTab(tabId, retries - 1), 500);
    } else {
      console.log("Tab removed successfully (after retry):", tabId);
    }
  });
}
