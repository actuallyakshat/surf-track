import React, { createContext, useEffect, useState } from "react"
import type { ScreenTimeData } from "~/types"

interface GlobalContextValue {
  screenTimeData: ScreenTimeData
  blockedDomains: string[]
  isLoading: boolean
  error: string | null
}

export const GlobalContext = createContext<GlobalContextValue | undefined>(
  undefined
)

interface GlobalProviderProps {
  children: React.ReactNode
}

export function GlobalProvider({ children }: GlobalProviderProps) {
  const [screenTimeData, setScreenTimeData] = useState<ScreenTimeData>({})
  const [blockedDomains, setBlockedDomains] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize data and listen for changes
  useEffect(() => {
    // Check if chrome.storage is available
    if (!chrome?.storage?.local || !chrome?.storage?.onChanged) {
      console.warn("Chrome storage API not available")
      setIsLoading(false)
      return
    }

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      // Only handle changes from local storage
      if (areaName !== "local") return

      if (changes.screenTimeData) {
        setScreenTimeData(changes.screenTimeData.newValue || {})
      }

      if (changes.blockedDomains) {
        setBlockedDomains(changes.blockedDomains.newValue || [])
      }
    }

    // 1. Attach listener FIRST to ensure no updates are missed during initial load
    chrome.storage.onChanged.addListener(handleStorageChange)

    // 2. Load initial data
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await chrome.storage.local.get([
          "screenTimeData",
          "blockedDomains"
        ])

        setScreenTimeData(result.screenTimeData || {})
        setBlockedDomains(result.blockedDomains || [])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load data from storage"
        )
        console.error("Error loading initial data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()

    // Cleanup: remove listener on unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  const value: GlobalContextValue = {
    screenTimeData,
    blockedDomains,
    isLoading,
    error
  }

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  )
}
