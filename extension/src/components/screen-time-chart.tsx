import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatSeconds, getDataKey, getWeekNumber } from "@/lib/functions";
import { ScreenTimeData } from "@/types/types";
import { CircleChevronLeft, CircleChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

interface DayData {
  day: string;
  screentime: number;
  dateKey: string;
}

// Chart configuration
const chartConfig: ChartConfig = {
  screentime: {
    label: "Duration",
    color: "hsl(var(--chart-1))",
  },
};

const convertToChartData = (
  data: ScreenTimeData,
  currentDate: Date
): DayData[] => {
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const startOfWeek = new Date(currentDate.getTime());

  return daysOfWeek.map((day, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    const yearWeekKey = getDataKey(date);
    const dateKey = date.toISOString().split("T")[0];

    const dayData = data[yearWeekKey]?.[dateKey] || {};
    const totalSeconds = Object.values(dayData).reduce(
      (sum, entry) => sum + (entry?.time || 0),
      0
    );

    return {
      day,
      screentime: Math.round(totalSeconds / 60),
      dateKey,
    };
  });
};

export function ScreenTimeChart({
  data,
  selectedDate,
  onDateSelect,
}: {
  data: ScreenTimeData;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}) {
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(
    () => new Date(selectedDate)
  );
  const [averageScreenTime, setAverageScreenTime] = useState<string>("");

  useEffect(() => {
    const dataForChart = convertToChartData(data, currentWeekDate);
    setChartData(dataForChart);
    const activeData = dataForChart.filter((day) => day.screentime > 0);
    if (activeData.length > 0) {
      const avgMinutes =
        activeData.reduce((sum, day) => sum + day.screentime, 0) /
        activeData.length;
      const hours = Math.floor(avgMinutes / 60);
      const minutes = Math.floor(avgMinutes % 60);

      const isCurrentWeek =
        getWeekNumber(new Date()) === getWeekNumber(currentWeekDate);

      setAverageScreenTime(
        isCurrentWeek
          ? `You have averaged ${hours}h ${minutes}m up to now this week`
          : `You averaged ${hours}h ${minutes}m this week`
      );
    } else {
      setAverageScreenTime("");
    }
  }, [currentWeekDate, data]);

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekDate);
    newDate.setDate(
      currentWeekDate.getDate() + (direction === "next" ? 7 : -7)
    );
    setCurrentWeekDate(newDate);
  };

  const hasData = (date: Date): boolean => {
    const yearWeekKey = getDataKey(date);
    return !!data?.[yearWeekKey];
  };

  const prevWeekDate = new Date(currentWeekDate);
  prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const nextWeekDate = new Date(currentWeekDate);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);

  return (
    <Card>
      <div className="flex items-center justify-between w-full px-5 pt-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold">Your Weekly Activity</h1>
          <p className="text-muted-foreground text-sm">
            Summary of your daily surf activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasData(prevWeekDate)}
            onClick={() => navigateWeek("prev")}
          >
            <CircleChevronLeft className="size-5" />
          </button>
          <button
            className="disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasData(nextWeekDate)}
            onClick={() => navigateWeek("next")}
          >
            <CircleChevronRight className="size-5" />
          </button>
        </div>
      </div>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={({ payload }) => {
                if (payload?.[0]?.value) {
                  return (
                    <span className="py-1 px-4 rounded-lg border shadow-md bg-background">
                      Duration:{" "}
                      {formatSeconds((payload[0].value as number) * 60)}
                    </span>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="screentime"
              fill="hsl(var(--chart-1))"
              radius={8}
              className="cursor-pointer"
              onClick={(e) => onDateSelect(e?.payload?.dateKey)}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {averageScreenTime && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            {averageScreenTime}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
