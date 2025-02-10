import { getDataKey } from "@/lib/functions";
import { ScreenTimeData, TabChangeResult } from "@/types/types";

let currentUrl = "";
let startTime = 0;
let favicon: string | undefined;

const IGNORED_DOMAINS = ["newtab", "extensions", "localhost", "settings"];

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed");
  await chrome.storage.local.get(["screenTimeData"], (result) => {
    console.log("ScreenTimeData:", result.screenTimeData);
  });

  // Create alarm to update screen time every minute
  chrome.alarms.create("updateCurrentTabScreenTime", { periodInMinutes: 0.5 });
});

// Listener for the alarm - now properly updating screen time
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "updateCurrentTabScreenTime") {
    await updateCurrentTabScreenTime();
  }
});

// Window focus change handler - now properly updating screen time
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await updateCurrentTabScreenTime();
  } else {
    // Focus is back on the window - start tracking new session
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        updateTabInfo(tabs[0]);
      }
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    if (tab.url) {
      // Update screen time for previous tab before switching
      await updateCurrentTabScreenTime();
      await isBlocked(new URL(tab.url).hostname, activeInfo.tabId, tab);
      console.log("Tab activated:", tab.url);
      updateTabInfo(tab);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    isBlocked(new URL(tab.url).hostname, tabId, tab);
  }
});

function resetTabInfo() {
  currentUrl = "";
  startTime = 0;
  favicon = undefined;
}

async function updateTabInfo(tab: chrome.tabs.Tab) {
  if (!tab.url) return;
  const url = new URL(tab.url);
  const domain = url.hostname;

  if (IGNORED_DOMAINS.some((ignored) => domain.includes(ignored))) {
    console.log(`Ignoring domain: ${domain}`);
    await updateCurrentTabScreenTime();
    resetTabInfo();
    return;
  }

  const result = handleTabChange(tab.url, currentUrl, favicon);
  if (!result) return;

  currentUrl = result.currentUrl;
  startTime = result.startTime;
  favicon = result.favicon;

  if (!tab.favIconUrl && tab.id) {
    retryFetchFavicon(tab.id, 5);
  } else if (tab.favIconUrl) {
    favicon = tab.favIconUrl;
  }
}

function retryFetchFavicon(tabId: number, retries: number) {
  if (retries <= 0) return;

  setTimeout(() => {
    chrome.tabs.get(tabId, (tab) => {
      if (tab && tab.favIconUrl) {
        favicon = tab.favIconUrl; // Uncommented this line
      } else if (retries > 1) {
        retryFetchFavicon(tabId, retries - 1);
      }
    });
  }, 1000);
}

async function updateScreenTime(
  domain: string,
  timeSpent: number,
  favicon?: string
) {
  //get the current date of machine.
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-CA");
  const key = getDataKey(new Date(Date.now()));

  chrome.storage.local.get(["screenTimeData"], (result) => {
    const screenTimeData: ScreenTimeData = result.screenTimeData || {};
    console.log("ScreenTimeData:", screenTimeData);
    const weekData = screenTimeData[key] || {};
    const dateData = weekData[dateStr] || {};

    // Ensure we don't count time periods less than 1 second
    if (timeSpent < 1) return;

    if (dateData[domain]) {
      dateData[domain].time += timeSpent;
      if (favicon) dateData[domain].favicon = favicon;
    } else {
      dateData[domain] = { time: timeSpent, favicon };
    }

    weekData[dateStr] = dateData;
    screenTimeData[key] = weekData;

    chrome.storage.local.set({ screenTimeData }, () => {
      console.log("Updated screen time:", screenTimeData);
    });
  });
}

async function isBlocked(domain: string, tabId: number, tab: chrome.tabs.Tab) {
  const blockedDomains = await chrome.storage.local.get("blockedDomains");
  console.log("Blocked domains:", blockedDomains);
  const blockedDomainList = blockedDomains.blockedDomains || [];
  console.log("DOMAIN :", domain);
  if (blockedDomainList.includes(domain)) {
    console.log("COMPARING :", domain, blockedDomainList);
    console.log("Tab is blocked:", tab.url);
    await retryRemoveTab(tabId);
  }
}

function retryRemoveTab(tabId: number, retries = 5) {
  if (retries <= 0) {
    console.error(`Failed to remove tab ${tabId} after multiple attempts`);
    return;
  }

  chrome.tabs.remove(tabId, () => {
    if (chrome.runtime.lastError) {
      console.warn(
        `Retrying to remove tab ${tabId}: ${chrome.runtime.lastError.message}`
      );
      setTimeout(() => retryRemoveTab(tabId, retries - 1), 500);
    } else {
      console.log(`Tab ${tabId} removed successfully`);
    }
  });
}

async function updateCurrentTabScreenTime() {
  if (currentUrl) {
    try {
      const endTime = Date.now();
      const timeSpent = Math.round((endTime - startTime) / 1000);
      const domain = new URL(currentUrl).hostname;

      if (timeSpent > 0) {
        // Only update if time spent is positive
        await updateScreenTime(domain, timeSpent, favicon);
      }
      startTime = endTime; // Reset start time
    } catch (error) {
      console.error("Error updating screen time:", error);
    }
  }
}

function handleTabChange(
  newUrl: string,
  currentUrl: string,
  favicon?: string
): TabChangeResult | null {
  if (newUrl !== currentUrl) {
    return {
      currentUrl: newUrl,
      startTime: Date.now(),
      favicon,
    };
  }
  return null;
}
