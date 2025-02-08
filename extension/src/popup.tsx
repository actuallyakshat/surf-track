import { Route, MemoryRouter as Router, Routes } from "react-router";

import "@/index.css";
import { GlobalProvider } from "./context/global-context";
import Dashboard from "./components/Dashboard";

function IndexPopup() {
  return (
    <div className="h-[600px] m-auto border border-black w-[500px] relative flex font-Inter text-base noscrollbar">
      <GlobalProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* <Route path="/blocked" element={<Blocked />} /> */}
          </Routes>
        </Router>
      </GlobalProvider>
    </div>
  );
}

export default IndexPopup;
