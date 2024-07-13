import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import LoginComponent from "~components/LoginComponent"

import "~style.css"

function IndexPopup() {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  async function getResponse() {
    const response = await sendToBackground({
      name: "ping"
    })
    console.log("test log")
    console.log("Response:", response)
  }

  // if (loading) {
  //   return <div>Loading...</div>
  // }

  return (
    <div className="min-h-[350px] min-w-[300px] p-5">
      {isAuthenticated ? (
        <div>Welcome! You are authenticated.</div>
      ) : (
        <LoginComponent setIsAuthenticated={setIsAuthenticated} />
      )}
    </div>
  )
}

export default IndexPopup
