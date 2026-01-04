import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { extractDailyDomains } from "~/lib/data-transformations"
import { formatSeconds } from "~/lib/time-utils"
import type { ScreenTimeData } from "~/types"

interface DailyBreakdownProps {
  selectedDate: string // ISO date
  screenTimeData: ScreenTimeData
}

export function DailyBreakdown({
  selectedDate,
  screenTimeData
}: DailyBreakdownProps) {
  // Extract and sort domains for the selected date
  const domains = useMemo(() => {
    return extractDailyDomains(screenTimeData, selectedDate)
  }, [screenTimeData, selectedDate])

  // Calculate total time
  const totalTime = useMemo(() => {
    return domains.reduce((sum, domain) => sum + domain.time, 0)
  }, [domains])

  return (
    <Card className="plasmo-border-none plasmo-p-0 plasmo-pt-3 plasmo-rounded-none plasmo-shadow-none">
      <CardHeader className="plasmo-px-2 plasmo-py-0">
        <CardTitle className="plasmo-text-xl plasmo-font-bold">
          Daily Breakdown - {selectedDate}
        </CardTitle>
      </CardHeader>
      <CardContent className="plasmo-px-2">
        {domains.length > 0 ? (
          <div className="plasmo-space-y-2">
            <div className="plasmo-text-sm plasmo-text-muted-foreground">
              Total screen time: {formatSeconds(totalTime)}
            </div>
            <div className="plasmo-divide-y plasmo-divide-border">
              {domains.map((item, index) => (
                <div
                  key={`${item.domain}-${index}`}
                  className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-py-3">
                  <button
                    onClick={() =>
                      chrome.tabs.create({ url: `https://${item.domain}` })
                    }
                    className="plasmo-flex plasmo-group plasmo-min-w-0 plasmo-max-w-[75%] plasmo-items-center plasmo-gap-3">
                    {item.favicon ? (
                      <img
                        src={item.favicon}
                        alt={`${item.domain} favicon`}
                        className="plasmo-size-8 plasmo-rounded-sm"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                          chrome.runtime.sendMessage({
                            type: "RETRY_FAVICON",
                            domain: item.domain
                          })
                        }}
                      />
                    ) : (
                      <div className="plasmo-size-8 plasmo-rounded-sm plasmo-gradient-to-br plasmo-from-slate-200 plasmo-to-slate-300 dark:plasmo-from-slate-700 dark:plasmo-to-slate-800 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-sm plasmo-font-semibold plasmo-text-slate-600 dark:plasmo-text-slate-300 plasmo-shadow-sm">
                        {item.domain.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="plasmo-font-medium group-hover:plasmo-underline plasmo-whitespace-nowrap plasmo-overflow-hidden plasmo-text-ellipsis">
                      {item.domain}
                    </span>
                  </button>
                  <span className="plasmo-text-muted-foreground plasmo-whitespace-nowrap">
                    {formatSeconds(item.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="plasmo-text-center plasmo-text-muted-foreground plasmo-py-8">
            No data available for this date
          </div>
        )}
      </CardContent>
    </Card>
  )
}
