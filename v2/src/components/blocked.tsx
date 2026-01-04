import { useEffect, useState, useMemo } from "react";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { TopBar } from "~/components/top-bar";
import { useGlobalContext } from "~/hooks/use-global-context";
import type { ScreenTimeData } from "~/types";

type DomainData = {
  domain: string;
  favicon?: string;
};

function extractAllDomains(
  screenTimeData: ScreenTimeData | null
): DomainData[] {
  if (!screenTimeData) return [];

  const domainSet = new Set<string>();
  const domains: DomainData[] = [];

  Object.values(screenTimeData).forEach((weekData) => {
    Object.values(weekData).forEach((dailyData) => {
      Object.entries(dailyData).forEach(([domain, data]) => {
        if (!domain || domainSet.has(domain)) return;
        domainSet.add(domain);
        domains.push({ domain, favicon: data.favicon });
      });
    });
  });

  return domains.sort((a, b) => a.domain.localeCompare(b.domain));
}

export function Blocked() {
  const [searchQuery, setSearchQuery] = useState("");
  const { screenTimeData } = useGlobalContext();
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);

  // Load all domains
  const allDomains = useMemo(() => {
    return extractAllDomains(screenTimeData);
  }, [screenTimeData]);

  // Filter domains
  const filteredDomains = useMemo(() => {
    return allDomains.filter((domain) =>
      domain.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allDomains]);

  // Load blocked domains
  useEffect(() => {
    const loadBlockedDomains = async () => {
      const result = await chrome.storage.local.get("blockedDomains");
      if (result && result.blockedDomains) {
        setBlockedDomains(result.blockedDomains);
      }
    };
    loadBlockedDomains();
  }, []);

  // Handle block/unblock
  const handleBlock = async (domain: string, checked: boolean) => {
    const newBlockedDomains = checked
      ? [...blockedDomains, domain]
      : blockedDomains.filter((d) => d !== domain);

    await chrome.storage.local.set({ blockedDomains: newBlockedDomains });
    setBlockedDomains(newBlockedDomains);
  };

  return (
    <div className="plasmo-w-full plasmo-h-full">
      <TopBar />
      <div className="plasmo-p-4">
        <h1 className="plasmo-text-2xl plasmo-font-bold">Blocked Websites</h1>
        <p className="plasmo-text-muted-foreground plasmo-text-sm">
          Websites you have blocked yourself from visiting.
        </p>
        <Input
          placeholder="Search for a website"
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
          className="plasmo-mt-4"
        />

        <div className="plasmo-mt-6 plasmo-space-y-3">
          {filteredDomains.length > 0 ? (
            <>
              <div className="plasmo-w-full plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-4">
                <p className="plasmo-font-bold plasmo-text-lg">Name</p>
                <p className="plasmo-font-bold plasmo-text-lg">Blocked?</p>
              </div>
              <div className="plasmo-divide-y plasmo-divide-border">
                {filteredDomains.map((domain) => (
                  <div
                    key={domain.domain}
                    className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-py-3"
                  >
                    <div className="plasmo-flex plasmo-items-center plasmo-min-w-0 plasmo-flex-1 plasmo-gap-3">
                      {domain.favicon ? (
                        <img
                          src={domain.favicon}
                          className="plasmo-size-8 plasmo-rounded-sm"
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="plasmo-size-8 plasmo-rounded-sm plasmo-bg-muted plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-xs plasmo-font-medium plasmo-text-muted-foreground">
                          {domain.domain.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <button
                        onClick={() => chrome.tabs.create({ url: `https://${domain.domain}` })}
                        className="hover:plasmo-underline plasmo-truncate plasmo-text-left plasmo-font-medium"
                      >
                        {domain.domain}
                      </button>
                    </div>
                    <div className="plasmo-flex-shrink-0">
                      <Switch
                        checked={blockedDomains.includes(domain.domain)}
                        onCheckedChange={(checked) =>
                          handleBlock(domain.domain, checked)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="plasmo-text-center plasmo-text-muted-foreground plasmo-text-sm plasmo-pt-6">
              {searchQuery
                ? "No websites found matching your search."
                : "Don't see your website? Make sure you have visited it at least once."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
