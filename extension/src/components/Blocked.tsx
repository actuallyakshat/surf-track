import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { formatSeconds, openNewTab, sortScreenTimeData } from "@/lib/functions"
import type { ScreenTimeData } from "@/types/types"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { useGlobalContext } from "../context/globalContext"
import TopBar from "./TopBar"

type DomainData = {
  domain: string
  favicon?: string
}

function extractAllDomains(screenTimeData: ScreenTimeData): DomainData[] {
  const domainSet = new Set<string>()
  const domains: DomainData[] = []

  for (const dailyData of Object.values(screenTimeData)) {
    for (const [domain, data] of Object.entries(dailyData)) {
      if (!domainSet.has(domain)) {
        domainSet.add(domain)
        domains.push({ domain, favicon: data.favicon })
      }
    }
  }

  return domains
}

export default function Blocked() {
  const [searchQuery, setSearchQuery] = useState("")
  const { data } = useGlobalContext()
  const sortedData = sortScreenTimeData(data)
  const [allDomains, setAllDomains] = useState<DomainData[]>(
    extractAllDomains(sortedData)
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
    setAllDomains(extractAllDomains(sortedData))
  }, [data])

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
        <div className="w-full flex justify-between items-center my-3">
          <p className="font-bold text-lg">Name</p>
          <p className="font-bold text-lg">Blocked?</p>
        </div>
        <div className="space-y-2">
          {filteredDomains.length > 0 ? (
            filteredDomains.map((domain, index) => (
              <div
                key={`${domain.domain}-${index}`}
                className="grid grid-cols-3 pr-6">
                <div className="flex items-center col-span-2">
                  <img
                    src={domain.favicon}
                    className="size-8 mr-2"
                    alt={domain.domain}
                  />
                  <button
                    onClick={() => openNewTab(domain.domain)}
                    className="hover:underline">
                    {domain.domain}
                  </button>
                </div>
                <div className="ml-auto">
                  <Switch />
                </div>
              </div>
            ))
          ) : (
            <h2 className="text-center text-muted-foreground text-sm pt-4">
              Surf some websites to see the websites you have visited.
            </h2>
          )}
        </div>
      </div>
    </div>
  )
}
