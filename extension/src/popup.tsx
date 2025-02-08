import { Route, MemoryRouter as Router, Routes } from "react-router-dom"

import "@/src/style.css"

import Dashboard from "@/src/components/Dashboard"
import { GlobalProvider } from "@/src/context/globalContext"

import Blocked from "./components/Blocked"

function IndexPopup() {
  return (
    <div className="h-[600px] w-[500px] relative flex font-Inter text-base noscrollbar">
      <GlobalProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/blocked" element={<Blocked />} />
          </Routes>
        </Router>
      </GlobalProvider>
    </div>
  )
}

export default IndexPopup
