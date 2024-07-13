import LoginComponent from "@/src/components/LoginComponent"
import { useState } from "react"
import { Route, MemoryRouter as Router, Routes } from "react-router-dom"

import "@/src/style.css"

import Dashboard from "./components/Dashboard"
import RegisterComponent from "./components/RegisterComponent"

function IndexPopup() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <div className="min-h-[500px] min-w-[400px] flex p-5 font-Inter text-base">
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/login"
            element={<LoginComponent setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route path="/register" element={<RegisterComponent />} />
        </Routes>
      </Router>
    </div>
  )
}

export default IndexPopup
