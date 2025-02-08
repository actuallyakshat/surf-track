import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { openNewTab } from "@/lib/functions"
import type { ScreenTimeData } from "@/types/types"
import { useEffect, useState } from "react"

import { useGlobalContext } from "../context/globalContext"
import TopBar from "./TopBar"

type DomainData = {
  domain: string
  favicon?: string
}

function extractAllDomains(
  screenTimeData: ScreenTimeData | null
): DomainData[] {
  if (!screenTimeData) return []

  const domainSet = new Set<string>()
  const domains: DomainData[] = []

  for (const [week] of Object.entries(screenTimeData)) {
    for (const [date, dailyData] of Object.entries(screenTimeData[week])) {
      for (const [domain, data] of Object.entries(dailyData)) {
        if (!domain || domainSet.has(domain)) continue

        domainSet.add(domain)
        domains.push({ domain, favicon: data.favicon })
      }
    }
  }

  return domains.sort((a, b) => a.domain.localeCompare(b.domain))
}

export default function Blocked() {
  const [searchQuery, setSearchQuery] = useState("")
  const { data } = useGlobalContext()
  const [blockedDomains, setBlockedDomains] = useState<string[]>([])
  const [allDomains, setAllDomains] = useState<DomainData[]>([])
  const [filteredDomains, setFilteredDomains] = useState<DomainData[]>([])

  useEffect(() => {
    if (data) {
      setAllDomains(extractAllDomains(data))
    }
  }, [data])

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = allDomains.filter((domain) =>
        domain.domain.includes(searchQuery)
      )
      setFilteredDomains(filtered)
    } else {
      setFilteredDomains(allDomains)
    }
  }, [searchQuery, allDomains])

  useEffect(() => {
    chrome.storage.local.get("blockedDomains", (result) => {
      if (result && result.blockedDomains) {
        setBlockedDomains(result.blockedDomains)
      }
    })
  }, [])

  const handleBlock = async (domain: string, checked: boolean) => {
    if (!domain) return

    const newBlockedDomains = checked
      ? [...blockedDomains, domain]
      : blockedDomains.filter((blockedDomain) => blockedDomain !== domain)

    await chrome.storage.local.set({ blockedDomains: newBlockedDomains })
    setBlockedDomains(newBlockedDomains)
  }

  return (
    <div className="w-full h-full">
      <TopBar />
      <div className="p-4">
        <h1 className="text-2xl font-bold">Blocked Websites</h1>
        <p className="text-muted-foreground text-sm">
          Websites you have blocked yourself from visiting.
        </p>
        <Input
          placeholder="Search for a website"
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-4"
        />

        <div className="space-y-3">
          {filteredDomains?.length > 0 ? (
            <>
              <div className="w-full flex justify-between items-center my-3">
                <p className="font-bold text-lg">Name</p>
                <p className="font-bold text-lg">Blocked?</p>
              </div>
              {filteredDomains.map((domain, index) => (
                <>
                  {domain.favicon && domain.domain && (
                    <div
                      key={`${domain.domain}-${index}`}
                      className="grid grid-cols-6 items-center pr-5">
                      <div className="flex items-center col-span-5 truncate">
                        <img
                          src={domain.favicon}
                          className="size-8 mr-3"
                          alt={domain.domain}
                        />
                        <button
                          onClick={() => openNewTab(domain.domain)}
                          className="hover:underline whitespace-nowrap">
                          {domain.domain}
                        </button>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <Switch
                          checked={blockedDomains.includes(domain.domain)}
                          onCheckedChange={(checked) =>
                            handleBlock(domain.domain, checked)
                          }
                        />
                      </div>
                    </div>
                  )}
                </>
              ))}
            </>
          ) : (
            <h2 className="text-center text-muted-foreground text-sm pt-6">
              Don't see your website? Make sure you have visited it at least
              once after installing the extension.
            </h2>
          )}
        </div>
      </div>
    </div>
  )
}
