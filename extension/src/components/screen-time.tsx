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

  useEffect(() => {
    console.log("Initial globalScreenTimeData:", globalScreenTimeData);
    console.log("Initial selectedDate:", selectedDate);
  }, [globalScreenTimeData, selectedDate]);

  const getData = useCallback(() => {
    const yearWeekKey = getDataKey(new Date(selectedDate));
    const dailyData = globalScreenTimeData[yearWeekKey]?.[selectedDate] || {};
    console.log("DAILY DATA --> ", dailyData);

    if (dailyData && Object.keys(dailyData).length > 0) {
      const sortedDayData = sortScreenTimeDataForDate(dailyData);
      console.log("Sorted day data:", sortedDayData);
      setDailyBreakdown(sortedDayData);
    } else {
      console.log("No data found for selected date, setting empty array");
      setDailyBreakdown([]);
    }
  }, [selectedDate, globalScreenTimeData]);

  useEffect(() => {
    getData();
    const interval = setInterval(getData, 5000);
    return () => clearInterval(interval);
  }, [getData, selectedDate, globalScreenTimeData]);

  return (
    <div className="p-2 space-y-2">
      {Object.keys(globalScreenTimeData).length > 0 ? (
        <ScreenTimeChart
          data={globalScreenTimeData}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      ) : (
        <p>No screen time data available.</p>
      )}
      <DailyScreenTimeBreakdown
        dailyBreakdown={dailyBreakdown}
        selectedDate={selectedDate}
      />
    </div>
  );
}
