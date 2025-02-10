// import ScreenTime from "./ScreenTime"
import { ScreenTime } from "./screen-time";
import TopBar from "./top-bar";

export default function Dashboard() {
  return (
    <div className="w-full">
      <TopBar />
      <ScreenTime />
    </div>
  );
}
