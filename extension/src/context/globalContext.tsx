import type { GlobalContextType, ScreenTimeData } from "@/types/types"
import axios from "axios"
import React, { useContext, useEffect, useState } from "react"

const GlobalContext: React.Context<GlobalContextType> =
  React.createContext(null)

const GlobalProvider = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState<ScreenTimeData>({})

  // Check if user is authenticated (token is stored in local storage)
  useEffect(() => {
    chrome.storage.sync.get("surfTrack_token", (result) => {
      if (result.surfTrack_token) {
        console.log("Token:", result.surfTrack_token)
        setIsAuthenticated(true)
      }
      setLoading(false)
    })
  }, [])

  // Get data from local storage
  useEffect(() => {
    function getData() {
      console.log("Getting data")
      chrome.storage.local.get(["screenTimeData"], async (result) => {
        // Type assertion to ensure correct structure
        const screenTimeData = (result.screenTimeData as ScreenTimeData) || {}
        if (!screenTimeData) {
          const response = await axios.post(
            process.env.BACKEND_URL + "/api/auth/validateToken"
          )
          console.log(response.data)
        }
        console.log("ScreenTimeData in global context:", screenTimeData)
        setData(screenTimeData)
      })
    }
    getData()
    const interval = setInterval(getData, 5000)
    return () => clearInterval(interval)
  }, [])

  function logoutHandler() {
    chrome.storage.sync.remove("surfTrack_token")
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
