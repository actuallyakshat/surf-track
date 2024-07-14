import React, { useContext, useEffect, useState } from "react"

interface GlobalContextType {
  loading: boolean
  setLoading: (loading: boolean) => void
  isAuthenticated: boolean
  setIsAuthenticated: (isAuthenticated: boolean) => void
}

const GlobalContext: React.Context<GlobalContextType> =
  React.createContext(null)

const GlobalProvider = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  useEffect(() => {
    chrome.storage.sync.get("surfTrack_token", (result) => {
      if (result.surfTrack_token) {
        console.log("Token:", result.surfTrack_token)
        setIsAuthenticated(true)
      }
      setLoading(false)
    })
  }, [])
  return (
    <GlobalContext.Provider
      value={{ loading, setLoading, isAuthenticated, setIsAuthenticated }}>
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
