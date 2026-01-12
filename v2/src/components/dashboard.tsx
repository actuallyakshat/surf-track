import { ScreenTime } from "~/components/screen-time"
import { TopBar } from "~/components/top-bar"

export function Dashboard() {
  return (
    <div className="plasmo-w-full">
      <TopBar />
      <ScreenTime />
    </div>
  )
}
