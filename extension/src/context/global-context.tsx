import type { GlobalContextType, ScreenTimeData } from "@/types/types";
import React, { useContext, useEffect, useState } from "react";

const GlobalContext: React.Context<GlobalContextType> = React.createContext(
  {} as GlobalContextType
);

const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<ScreenTimeData>({});

  useEffect(() => {
    async function getData() {
      await chrome.storage.local.get(["screenTimeData"], (result) => {
        setData(result.screenTimeData);
      });
    }
    getData();
    const interval = setInterval(getData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        data,
        setData,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};

export { GlobalProvider, useGlobalContext };
