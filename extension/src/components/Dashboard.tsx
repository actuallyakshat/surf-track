import React from "react"

import { useGlobalContext } from "../context/globalContext"
import ScreenTime from "./ScreenTime"
import TopBar from "./TopBar"

export default function Dashboard() {
  const { loading } = useGlobalContext()
  if (loading) return null
  return (
    <div className="w-full">
      <TopBar />
      <ScreenTime />
    </div>
  )
}
