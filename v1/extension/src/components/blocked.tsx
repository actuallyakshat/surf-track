import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ScreenTimeData } from "@/types/types";
import { useEffect, useState } from "react";
import TopBar from "./top-bar";
import { useGlobalContext } from "@/context/use-global-context";

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

// Function to safely open a new tab
const openNewTab = (domain: string) => {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;
  chrome.tabs.create({ url });
};

export default function Blocked() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useGlobalContext();
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [allDomains, setAllDomains] = useState<DomainData[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<DomainData[]>([]);

  // Load all domains when data changes
  useEffect(() => {
    if (data) {
      const domains = extractAllDomains(data);
      setAllDomains(domains);
      setFilteredDomains(domains); // Initialize filtered domains with all domains
    }
  }, [data]);

  // Filter domains based on search query
  useEffect(() => {
    const filtered = allDomains.filter((domain) =>
      domain.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDomains(filtered);
  }, [searchQuery, allDomains]);

  // Load blocked domains on component mount
  useEffect(() => {
    const loadBlockedDomains = async () => {
      try {
        const result = await chrome.storage.local.get("blockedDomains");
        if (result && result.blockedDomains) {
          setBlockedDomains(result.blockedDomains);
        }
      } catch (error) {
        console.error("Error loading blocked domains:", error);
      }
    };

    loadBlockedDomains();
  }, []);

  // Handle blocking/unblocking domains
  const handleBlock = async (domain: string, checked: boolean) => {
    if (!domain) return;

    try {
      const newBlockedDomains = checked
        ? [...blockedDomains, domain]
        : blockedDomains.filter((blockedDomain) => blockedDomain !== domain);

      await chrome.storage.local.set({ blockedDomains: newBlockedDomains });
      setBlockedDomains(newBlockedDomains);
    } catch (error) {
      console.error("Error updating blocked domains:", error);
    }
  };

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
          value={searchQuery}
          className="mt-4"
        />

        <div className="space-y-3">
          {filteredDomains.length > 0 ? (
            <div className="mt-6">
              <div className="w-full flex justify-between items-center mb-4">
                <p className="font-bold text-lg">Name</p>
                <p className="font-bold text-lg">Blocked?</p>
              </div>
              {filteredDomains.map((domain) => (
                <div
                  key={domain.domain}
                  className="grid grid-cols-6 items-center pr-5 py-2"
                >
                  <div className="flex items-center col-span-5 truncate">
                    {domain.favicon && (
                      <img
                        src={domain.favicon}
                        className="w-8 h-8 mr-3"
                        alt={`${domain.domain} favicon`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <button
                      onClick={() => openNewTab(domain.domain)}
                      className="hover:underline whitespace-nowrap truncate text-left"
                    >
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
              ))}
            </div>
          ) : (
            <h2 className="text-center text-muted-foreground text-sm pt-6">
              {searchQuery
                ? "No websites found matching your search."
                : "Don't see your website? Make sure you have visited it at least once after installing the extension."}
            </h2>
          )}
        </div>
      </div>
    </div>
  );
}
