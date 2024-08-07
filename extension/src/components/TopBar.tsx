import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { useGlobalContext } from "@/src/context/globalContext"
import { BanIcon, Home, LogIn, LogOut } from "lucide-react"
import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"

export default function TopBar() {
  const { pathname } = useLocation()
  const { isAuthenticated, logoutHandler } = useGlobalContext()
  const [open, setOpen] = useState(false)

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

        {/* {isAuthenticated ? (
          <div className="flex items-center gap-4">
            
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger>
                    <button
                      className="min-h-0 h-fit flex items-center justify-center hover:text-white text-muted-foreground transition-colors"
                      onClick={() => setOpen(true)}>
                      <LogOut className="size-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>You are about to log out</AlertDialogTitle>
                  <AlertDialogDescription>
                    We will continue to track your activity, but you will no
                    longer be able to access the data before logging in again.
                    Kindly remove the extension to stop tracking.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => logoutHandler()}>
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="flex items-center gap-4">
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
            <Tooltip>
              <TooltipTrigger>
                <Link
                  to={"/login"}
                  className="flex items-center gap-2 text-sm hover:underline font-medium">
                  <LogIn className="size-5 stroke-muted-foreground hover:stroke-white transition-colors" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Log in</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )} */}
      </TooltipProvider>
    </div>
  )
}
