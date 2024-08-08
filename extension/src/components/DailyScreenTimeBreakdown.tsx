import {
  formatDate,
  formatLocalDate,
  formatSeconds,
  openNewTab
} from "@/lib/functions"
import type { DailyData } from "@/types/types"

export default function DailyScreenTimeBreakdown({
  dailyBreakdown,
  selectedDate
}: {
  dailyBreakdown: DailyData | {}
  selectedDate: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">
        {selectedDate == formatLocalDate(new Date()) ? (
          "Today's Activity"
        ) : (
          <>{formatDate(selectedDate)} Activity</>
        )}
      </h2>
      <div className="space-y-4 pt-4">
        {Object.keys(dailyBreakdown).length > 0 ? (
          Object.keys(dailyBreakdown)
            .filter((domain) => dailyBreakdown[domain].favicon)
            .filter((domain) => dailyBreakdown[domain].timeSpent > 0)
            .map((domain, index) => (
              <div key={index}>
                {domain && (
                  <div key={domain} className="grid grid-cols-7 pr-6">
                    <div className="flex items-center col-span-6 gap-2 truncate">
                      <img
                        src={dailyBreakdown[domain].favicon}
                        className="size-8 mr-2"
                        alt={domain}
                      />
                      <button
                        onClick={() => openNewTab(domain)}
                        className="hover:underline whitespace-nowrap flex-1 flex items-center justify-start w-full">
                        {domain}
                      </button>
                    </div>
                    <p className="col-span-1 text-right">
                      {formatSeconds(dailyBreakdown[domain].timeSpent)}
                    </p>
                  </div>
                )}
              </div>
            ))
        ) : (
          <h2 className="text-center text-muted-foreground text-sm py-2">
            No data for today.
          </h2>
        )}
      </div>
    </div>
  )
}
