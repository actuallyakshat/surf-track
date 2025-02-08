import ScreenTime from "./ScreenTime"
import TopBar from "./TopBar"

export default function Dashboard() {
  return (
    <div className="w-full">
      <TopBar />
      <ScreenTime />
    </div>
  )
}
