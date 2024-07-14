import React from "react"

import { useGlobalContext } from "../context/globalContext"
import Landing from "./Landing"
import ScreenTime from "./ScreenTime"
import TopBar from "./TopBar"

export default function Dashboard() {
  const { isAuthenticated, loading } = useGlobalContext()
  if (loading) return null
  return (
    <div className="w-full">
      <TopBar />
      {isAuthenticated ? <ScreenTime /> : <Landing />}
    </div>
  )
}
