import { useGlobalContext } from "@/context/global-context";
import {
  DailyData,
  formatLocalDate,
  getDataKey,
  sortScreenTimeDataForDate,
} from "@/lib/functions";
import { useCallback, useEffect, useState } from "react";
import { DailyScreenTimeBreakdown } from "./daily-screen-time-breakdown";
import { ScreenTimeChart } from "./screen-time-chart";

export function ScreenTime() {
  const { data: globalScreenTimeData = {} } = useGlobalContext();
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyData[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    formatLocalDate(new Date(Date.now()))
  );

  useEffect(() => {}, [globalScreenTimeData, selectedDate]);

  const getData = useCallback(() => {
    const yearWeekKey = getDataKey(new Date(selectedDate));
    const dailyData = globalScreenTimeData[yearWeekKey]?.[selectedDate] || {};

    if (dailyData && Object.keys(dailyData).length > 0) {
      const sortedDayData = sortScreenTimeDataForDate(dailyData);
      setDailyBreakdown(sortedDayData);
    } else {
      setDailyBreakdown([]);
    }
  }, [selectedDate, globalScreenTimeData]);

  useEffect(() => {
    getData();
    const interval = setInterval(getData, 5000);
    return () => clearInterval(interval);
  }, [getData, selectedDate, globalScreenTimeData]);

  return (
    <div className="px-2 py-2 space-y-2">
      {Object.keys(globalScreenTimeData).length > 0 ? (
        <ScreenTimeChart
          data={globalScreenTimeData}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      ) : (
        <p className="text-center text-sm text-gray-500 py-3">
          No data available yet. Start surfing and we will give you a breakdown
          of your daily surfing activity.
        </p>
      )}
      <DailyScreenTimeBreakdown
        dailyBreakdown={dailyBreakdown}
        selectedDate={selectedDate}
      />
    </div>
  );
}
