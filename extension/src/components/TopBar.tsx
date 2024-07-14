import { useGlobalContext } from "@/src/context/globalContext"
import { BanIcon, Home } from "lucide-react"
import React from "react"
import { Link } from "react-router-dom"

export default function TopBar() {
  const { isAuthenticated } = useGlobalContext()
  return (
    <div className="h-12 border-b w-full dark bg-background px-4 flex items-center justify-between text-white">
      <Link to="/">
        <Home className="size-5" />
      </Link>
      {isAuthenticated ? (
        <Link
          to={"/blocked"}
          className="flex items-center gap-2 text-sm hover:underline font-medium">
          <BanIcon className="size-5" />
        </Link>
      ) : (
        <Link
          to={"/login"}
          className="flex items-center gap-2 text-sm hover:underline font-medium">
          Login
        </Link>
      )}
    </div>
  )
}
