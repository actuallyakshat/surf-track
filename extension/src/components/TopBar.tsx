import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { BanIcon, Home } from "lucide-react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"

export default function TopBar() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-12 border-b w-full dark bg-background px-4 flex items-center justify-between text-white">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger>
            <Link to="/">
              <Home
                className={`${pathname === "/" ? "text-white" : "text-muted-foreground"} size-5`}
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dashboard</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Link
              to={"/blocked"}
              className="flex items-center gap-2 text-sm hover:underline font-medium">
              <BanIcon
                className={`${pathname === "/blocked" ? "text-white" : "text-muted-foreground"} size-5`}
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Blocked Websites</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
