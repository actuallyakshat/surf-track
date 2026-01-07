import { MemoryRouter, Route, Routes } from "react-router-dom"

import { Blocked } from "~/components/blocked"
import { Dashboard } from "~/components/dashboard"
import { ErrorBoundary } from "~/components/error-boundary"
import { LogViewer } from "~/components/log-viewer"
import { Reset } from "~/components/reset"
import { GlobalProvider } from "~/context/global-context"

import "~style.css"

function IndexPopup() {
  return (
    <div
      className="plasmo-w-[500px] plasmo-h-[600px]"
      style={{ width: "500px", height: "600px" }}>
      <ErrorBoundary>
        <GlobalProvider>
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/blocked" element={<Blocked />} />
              <Route path="/logs" element={<LogViewer />} />
              <Route path="/reset" element={<Reset />} />
            </Routes>
          </MemoryRouter>
        </GlobalProvider>
      </ErrorBoundary>
    </div>
  )
}

export default IndexPopup
