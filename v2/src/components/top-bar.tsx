import { BanIcon, FileText, Home } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "~/components/ui/tooltip"

export function TopBar() {
  const { pathname } = useLocation()

  return (
    <div className="plasmo-min-h-12 plasmo-border-b plasmo-w-full plasmo-bg-slate-950 plasmo-px-4 plasmo-flex plasmo-items-center plasmo-gap-4">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/">
              <Home
                className={`${
                  pathname === "/"
                    ? "plasmo-text-white"
                    : "plasmo-text-slate-500"
                } plasmo-size-5`}
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dashboard</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/blocked">
              <BanIcon
                className={`${
                  pathname === "/blocked"
                    ? "plasmo-text-white"
                    : "plasmo-text-slate-500"
                } plasmo-size-5`}
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Blocked Websites</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/logs">
              <FileText
                className={`${
                  pathname === "/logs"
                    ? "plasmo-text-white"
                    : "plasmo-text-slate-500"
                } plasmo-size-5`}
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>System Logs</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
