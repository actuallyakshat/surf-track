import { MemoryRouter, Route, Routes } from "react-router-dom"
import { ErrorBoundary } from "~/components/error-boundary"
import { Dashboard } from "~/components/dashboard"
import { LogViewer } from "~/components/log-viewer"
import { Blocked } from "~/components/blocked"
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
            </Routes>
          </MemoryRouter>
        </GlobalProvider>
      </ErrorBoundary>
    </div>
  )
}

export default IndexPopup
