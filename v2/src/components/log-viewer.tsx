import { useEffect, useState } from "react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { TopBar } from "~/components/top-bar"

import { Logger } from "../background/logger"

interface LogEntry {
  timestamp: number
  level: string
  source: string
  message: string
  data?: any
}

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("")
  const [copySuccess, setCopySuccess] = useState(false)

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const allLogs = await Logger.getLogs()
      setLogs(allLogs)
    } catch (err) {
      console.error("Failed to load logs:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = async () => {
    await Logger.clearLogs()
    setLogs([])
  }

  const exportLogs = async () => {
    const logsJson = await Logger.exportLogs()
    const blob = new Blob([logsJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `surf-track-logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyAllLogs = async () => {
    const logsToUse = filter ? filteredLogs : logs

    const formattedLogs = logsToUse
      .map((log) => {
        const timestamp = new Date(log.timestamp).toLocaleString()
        const dataStr = log.data
          ? `\n  Data: ${JSON.stringify(log.data, null, 2)}`
          : ""
        return `[${timestamp}] [${log.level}] [${log.source}] ${log.message}${dataStr}`
      })
      .join("\n\n")

    try {
      await navigator.clipboard.writeText(formattedLogs)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy logs:", err)
      alert("Failed to copy logs to clipboard")
    }
  }

  useEffect(() => {
    loadLogs()
    // Auto-refresh every 2 seconds
    const interval = setInterval(loadLogs, 2000)
    return () => clearInterval(interval)
  }, [])

  const filteredLogs = filter
    ? logs.filter(
        (log) =>
          log.message.toLowerCase().includes(filter.toLowerCase()) ||
          log.source.toLowerCase().includes(filter.toLowerCase())
      )
    : logs

  return (
    <div className="plasmo-w-full plasmo-h-full">
      <TopBar />
      <div className="plasmo-p-4 plasmo-h-[calc(100%-48px)]">
        <Card className="plasmo-h-full plasmo-flex plasmo-flex-col">
      <CardHeader>
        <CardTitle className="plasmo-flex plasmo-items-center plasmo-justify-between">
          <span>Debug Logs ({filteredLogs.length})</span>
          <div className="plasmo-flex plasmo-gap-2">
            <Button size="sm" variant="outline" onClick={loadLogs}>
              Refresh
            </Button>
            <Button
              size="sm"
              variant={copySuccess ? "default" : "outline"}
              onClick={copyAllLogs}>
              {copySuccess ? "Copied!" : "Copy All"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportLogs}>
              Export
            </Button>
            <Button size="sm" variant="destructive" onClick={clearLogs}>
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="plasmo-flex-1 plasmo-overflow-y-auto">
        <div className="plasmo-mb-4">
          <input
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-border plasmo-rounded-md plasmo-text-sm"
          />
        </div>

        {isLoading ? (
          <div className="plasmo-text-center plasmo-text-muted-foreground">
            Loading logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="plasmo-text-center plasmo-text-muted-foreground">
            No logs found
          </div>
         ) : (
          <div className="plasmo-space-y-2">
            {[...filteredLogs].reverse().map((log, index) => (
              <div
                key={index}
                className={`plasmo-p-2 plasmo-rounded plasmo-text-xs plasmo-font-mono ${
                  log.level === "ERROR"
                    ? "plasmo-bg-destructive/10 plasmo-text-destructive"
                    : log.level === "WARN"
                      ? "plasmo-bg-yellow-100 plasmo-text-yellow-900"
                      : log.level === "INFO"
                        ? "plasmo-bg-blue-50 plasmo-text-blue-900"
                        : "plasmo-bg-muted plasmo-text-muted-foreground"
                }`}>
                <div className="plasmo-flex plasmo-items-start plasmo-gap-2">
                  <span className="plasmo-text-muted-foreground plasmo-whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="plasmo-font-semibold plasmo-min-w-[60px]">
                    [{log.level}]
                  </span>
                  <span className="plasmo-text-muted-foreground plasmo-min-w-[120px]">
                    {log.source}
                  </span>
                  <span className="plasmo-flex-1">{log.message}</span>
                </div>
                {log.data && (
                  <pre className="plasmo-mt-1 plasmo-ml-[200px] plasmo-text-xs plasmo-opacity-70 plasmo-overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
      </div>
    </div>
  )
}
