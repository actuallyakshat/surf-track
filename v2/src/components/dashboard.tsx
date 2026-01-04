import { TopBar } from "~/components/top-bar"
import { ScreenTime } from "~/components/screen-time"

export function Dashboard() {
  return (
    <div className="plasmo-w-full">
      <TopBar />
      <ScreenTime />
    </div>
  )
}
