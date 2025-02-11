import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyData, formatSeconds } from "@/lib/functions";

interface DailyScreenTimeBreakdownProps {
  dailyBreakdown: DailyData[];
  selectedDate: string;
}

export function DailyScreenTimeBreakdown({
  dailyBreakdown,
  selectedDate,
}: DailyScreenTimeBreakdownProps) {
  const totalTime = dailyBreakdown.reduce((acc, curr) => acc + curr.time, 0);

  return (
    <Card className="border-none p-0 pt-3 rounded-none shadow-none">
      <CardHeader className="px-2 py-0">
        <CardTitle className="text-xl font-bold">
          Daily Breakdown - {new Date(selectedDate).toLocaleDateString("en-CA")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        {dailyBreakdown.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Total screen time: {formatSeconds(totalTime)}
            </div>
            <div>
              {dailyBreakdown.map((item, index) => (
                <div
                  key={`${item.domain}-${index}`}
                  className="flex items-center justify-between py-2"
                >
                  <button
                    onClick={() =>
                      chrome.tabs.create({ url: `https://${item.domain}` })
                    }
                    className="flex group min-w-0 max-w-[75%] items-center gap-3"
                  >
                    {item.favicon && (
                      <img
                        src={item.favicon}
                        alt={`${item.domain} favicon`}
                        className="size-8"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="font-medium group-hover:underline whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.domain}
                    </span>
                  </button>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {formatSeconds(item.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No data available for this date
          </div>
        )}
      </CardContent>
    </Card>
  );
}
