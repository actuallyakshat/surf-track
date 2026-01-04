import { useState } from "react";
import { useGlobalContext } from "~/hooks/use-global-context";
import { getTodayDate } from "~/lib/time-utils";
import { LoadingState } from "~/components/loading-state";
import { Alert } from "~/components/ui/alert";
import { ScreenTimeChart } from "~/components/screen-time-chart";
import { DailyBreakdown } from "~/components/daily-breakdown";

export function ScreenTime() {
  const { screenTimeData, isLoading, error } = useGlobalContext();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  // Navigate week
  const handleNavigateWeek = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === "next" ? 7 : -7));
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  // Handle date selection from chart
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  // Show loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Show error state
  if (error) {
    return (
      <div className="plasmo-p-4">
        <Alert variant="destructive">
          <div className="plasmo-font-medium">Error loading data</div>
          <div className="plasmo-text-sm">{error}</div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="plasmo-flex plasmo-flex-col plasmo-h-full">
      {/* Screen Time Chart */}
      <div className="plasmo-p-4">
        <ScreenTimeChart
          selectedDate={selectedDate}
          screenTimeData={screenTimeData}
          onDateSelect={handleDateSelect}
          onNavigateWeek={handleNavigateWeek}
        />
      </div>

      {/* Daily Breakdown */}
      <div className="plasmo-px-4 plasmo-pb-4">
        <DailyBreakdown
          selectedDate={selectedDate}
          screenTimeData={screenTimeData}
        />
      </div>
    </div>
  );
}
