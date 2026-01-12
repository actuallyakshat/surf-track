import { AlertTriangle } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { TopBar } from "~/components/top-bar"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"

interface DataOption {
  key: string
  label: string
  description: string
  storageKey: string
  storageType: "local" | "session"
}

const dataOptions: DataOption[] = [
  {
    key: "screenTimeData",
    label: "Screen Time Data",
    description: "All recorded browsing time across all dates",
    storageKey: "screenTimeData",
    storageType: "local"
  },
  {
    key: "blockedDomains",
    label: "Blocked Websites List",
    description: "Your list of blocked domains",
    storageKey: "blockedDomains",
    storageType: "local"
  },
  {
    key: "archivedData",
    label: "Archived Data",
    description: "Historical data moved to archive storage",
    storageKey: "archivedData",
    storageType: "local"
  },
  {
    key: "trackingState",
    label: "Current Tracking State",
    description: "Active session being tracked (resets current timer)",
    storageKey: "trackingState",
    storageType: "session"
  }
]

export function Reset() {
  const navigate = useNavigate()
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const toggleOption = (key: string) => {
    const newSelected = new Set(selectedOptions)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedOptions(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedOptions.size === dataOptions.length) {
      setSelectedOptions(new Set())
    } else {
      setSelectedOptions(new Set(dataOptions.map((opt) => opt.key)))
    }
  }

  const handleClearData = () => {
    if (selectedOptions.size === 0) return
    setShowConfirmation(true)
  }

  const confirmClear = async () => {
    setIsClearing(true)
    try {
      const localKeys: string[] = []
      const sessionKeys: string[] = []

      selectedOptions.forEach((key) => {
        const option = dataOptions.find((opt) => opt.key === key)
        if (option) {
          if (option.storageType === "local") {
            localKeys.push(option.storageKey)
          } else {
            sessionKeys.push(option.storageKey)
          }
        }
      })

      if (localKeys.length > 0) {
        await chrome.storage.local.remove(localKeys)
      }
      if (sessionKeys.length > 0) {
        await chrome.storage.session.remove(sessionKeys)
      }

      // Reset state and navigate back
      setSelectedOptions(new Set())
      setShowConfirmation(false)
      navigate("/")
    } catch (error) {
      console.error("Failed to clear data:", error)
    } finally {
      setIsClearing(false)
    }
  }

  const cancelConfirmation = () => {
    setShowConfirmation(false)
  }

  if (showConfirmation) {
    return (
      <div className="plasmo-h-full plasmo-bg-slate-900 plasmo-text-white plasmo-flex plasmo-flex-col">
        <TopBar />
        <div className="plasmo-flex-1 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-8">
          <Card className="plasmo-p-6 plasmo-bg-slate-800 plasmo-border-slate-700 plasmo-max-w-md">
            <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-gap-4">
              <AlertTriangle className="plasmo-size-12 plasmo-text-amber-500" />
              <h2 className="plasmo-text-xl plasmo-font-semibold plasmo-text-center">
                Are you sure you want to clear your data?
              </h2>
              <p className="plasmo-text-slate-400 plasmo-text-center plasmo-text-sm">
                This action is irreversible. The selected data will be
                permanently deleted and cannot be recovered.
              </p>
              <div className="plasmo-flex plasmo-gap-3 plasmo-mt-4 plasmo-w-full">
                <Button
                  variant="outline"
                  onClick={cancelConfirmation}
                  disabled={isClearing}
                  className="plasmo-flex-1">
                  No, Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmClear}
                  disabled={isClearing}
                  className="plasmo-flex-1">
                  {isClearing ? "Clearing..." : "Yes, Clear Data"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="plasmo-h-full plasmo-bg-slate-900 plasmo-text-white plasmo-flex plasmo-flex-col">
      <TopBar />
      <div className="plasmo-flex-1 plasmo-overflow-y-auto plasmo-p-6">
        <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-mb-6">
          <AlertTriangle className="plasmo-size-6 plasmo-text-amber-500" />
          <h1 className="plasmo-text-2xl plasmo-font-semibold">Reset Data</h1>
        </div>

        <Card className="plasmo-p-6 plasmo-bg-slate-800 plasmo-border-slate-700">
          <p className="plasmo-text-slate-400 plasmo-mb-6 plasmo-text-sm">
            Select the data you want to permanently delete from your browsing
            history.
          </p>

          <div className="plasmo-flex plasmo-flex-col plasmo-gap-4">
            {/* Select All Checkbox */}
            <div className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-pb-3 plasmo-border-b plasmo-border-slate-700">
              <Checkbox
                id="select-all"
                checked={selectedOptions.size === dataOptions.length}
                onChange={toggleSelectAll}
              />
              <Label
                htmlFor="select-all"
                className="plasmo-font-semibold plasmo-cursor-pointer">
                Select All
              </Label>
            </div>

            {/* Individual Options */}
            {dataOptions.map((option) => (
              <div
                key={option.key}
                className="plasmo-flex plasmo-items-start plasmo-gap-3">
                <Checkbox
                  id={option.key}
                  checked={selectedOptions.has(option.key)}
                  onChange={() => toggleOption(option.key)}
                  className="plasmo-mt-1"
                />
                <div className="plasmo-flex-1">
                  <Label
                    htmlFor={option.key}
                    className="plasmo-font-medium plasmo-cursor-pointer plasmo-block">
                    {option.label}
                  </Label>
                  <p className="plasmo-text-sm plasmo-text-slate-400 plasmo-mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="plasmo-flex plasmo-gap-3 plasmo-mt-6 plasmo-pt-6 plasmo-border-t plasmo-border-slate-700">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="plasmo-flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={selectedOptions.size === 0}
              className="plasmo-flex-1">
              Clear Data
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
