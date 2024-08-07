import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { formatSeconds, openNewTab, sortScreenTimeData } from "@/lib/functions"
import type { ScreenTimeData } from "@/types/types"
import React, { useEffect, useState } from "react"

import { useGlobalContext } from "../context/globalContext"
import TopBar from "./TopBar"

type DomainData = {
  domain: string
  favicon?: string
}

function extractAllDomains(screenTimeData: ScreenTimeData): DomainData[] {
  const domainSet = new Set<string>()
  const domains: DomainData[] = []
  for (const [week] of Object.entries(screenTimeData)) {
    for (const [date, dailyData] of Object.entries(screenTimeData[week])) {
      for (const [domain, data] of Object.entries(dailyData)) {
        if (!domain) continue
        if (!domainSet.has(domain)) {
          domainSet.add(domain)
          domains.push({ domain, favicon: data.favicon })
        }
      }
    }
  }
  domains.sort((a, b) => a.domain.localeCompare(b.domain))
  return domains
}

export default function Blocked() {
  const [searchQuery, setSearchQuery] = useState("")
  const { data } = useGlobalContext()
  const [blockedDomains, setBlockedDomains] = useState<string[]>([])
  const [allDomains, setAllDomains] = useState<DomainData[]>(
    extractAllDomains(data)
  )
  const [filteredDomains, setFilteredDomains] =
    useState<DomainData[]>(allDomains)

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
    setAllDomains(extractAllDomains(data))
  }, [data])

  useEffect(() => {
    chrome.storage.local.get("blockedDomains", (result) => {
      setBlockedDomains(result.blockedDomains || [])
      console.log("Blocked domains:", result.blockedDomains)
    })
  }, [])

  async function handleBlock(domain: string, checked: boolean) {
    const result = await chrome.storage.local.get("blockedDomains")
    const blockedDomains = result.blockedDomains || []

    if (checked) {
      console.log("Blocking domain:", domain)
      const newBlockedDomains = [...blockedDomains, domain]
      await chrome.storage.local.set({ blockedDomains: newBlockedDomains })
      setBlockedDomains(newBlockedDomains)
    } else {
      console.log("Unblocking domain:", domain)
      const newBlockedDomains = blockedDomains.filter(
        (blockedDomain) => blockedDomain !== domain
      )
      console.log("New blocked domains:", newBlockedDomains)
      await chrome.storage.local.set({ blockedDomains: newBlockedDomains })
      setBlockedDomains(newBlockedDomains)
    }
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
          {filteredDomains.length > 0 ? (
            <>
              <div className="w-full flex justify-between items-center my-3">
                <p className="font-bold text-lg">Name</p>
                <p className="font-bold text-lg">Blocked?</p>
              </div>
              {filteredDomains.map((domain, index) => (
                <>
                  {domain.favicon && (
                    <div
                      key={`${domain.domain}-${index}`}
                      className="grid grid-cols-3 pr-6">
                      <div className="flex items-center col-span-2">
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
                      <div className="ml-auto">
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
