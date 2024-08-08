import type { GlobalContextType, ScreenTimeData } from "@/types/types"
import React, { useContext, useEffect, useState } from "react"

const GlobalContext: React.Context<GlobalContextType> =
  React.createContext(null)

const GlobalProvider = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState<ScreenTimeData>({})

  // Check if user is authenticated (token is stored in local storage)
  useEffect(() => {
    chrome.storage.local.get("surfTrack_token", (result) => {
      if (result.surfTrack_token) {
        setIsAuthenticated(true)
      }
      setLoading(false)
    })
  }, [])

  // Get data from local storage
  useEffect(() => {
    async function getData() {
      await chrome.storage.local.get(["screenTimeData"], (result) => {
        setData(result.screenTimeData)
      })
    }
    getData()
    const interval = setInterval(getData, 10000)
    return () => clearInterval(interval)
  }, [])

  function logoutHandler() {
    chrome.storage.local.remove("surfTrack_token")
    setIsAuthenticated(false)
  }

  return (
    <GlobalContext.Provider
      value={{
        loading,
        setLoading,
        isAuthenticated,
        setIsAuthenticated,
        data,
        setData,
        logoutHandler
      }}>
      {children}
    </GlobalContext.Provider>
  )
}

const useGlobalContext = () => {
  const context = useContext(GlobalContext)
  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalProvider")
  }
  return context
}
export { GlobalProvider, useGlobalContext }
