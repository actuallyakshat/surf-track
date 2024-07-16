import { Button } from "@nextui-org/react"
import { Link } from "react-router-dom"

export default function Landing() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-sky-100 h-full w-full px-6 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-center font-black text-2xl">
          Surf <span className="text-sky-500">Smarter</span>, Stay{" "}
          <span className="text-sky-500">Mindful</span>
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          Surf Track tracks the amount of time you spend on the web and gives
          you a breakdown of your activities.
        </p>
        <Link
          to={"/login"}
          className="text-sm font-medium bg-sky-500 px-4 py-2 text-white mt-4 rounded-sm">
          Login to get started
        </Link>
      </div>
    </div>
  )
}
