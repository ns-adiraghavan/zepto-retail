import React, { createContext, useContext, useEffect, useState } from "react";
import {
  hydrateDatasets,
  PriceRecord,
  AvailabilityRecord,
  SearchRankRecord,
  AssortmentRecord,
} from "@/data/dataLoader";

interface DataContextValue {
  loaded: boolean;
}

const DataContext = createContext<DataContextValue>({ loaded: false });

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [price, availability, search, assortment] = await Promise.all([
        fetch("/data/price_tracking.json").then((r) => r.json() as Promise<PriceRecord[]>),
        fetch("/data/availability_tracking.json").then((r) => r.json() as Promise<AvailabilityRecord[]>),
        fetch("/data/search_rank_tracking.json").then((r) => r.json() as Promise<SearchRankRecord[]>),
        fetch("/data/assortment_tracking.json").then((r) => r.json() as Promise<AssortmentRecord[]>),
      ]);
      hydrateDatasets({
        priceTracking: price,
        availabilityTracking: availability,
        searchRankTracking: search,
        assortmentTracking: assortment,
      });
      setLoaded(true);
    }
    load();
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading intelligence data…</p>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ loaded }}>
      {children}
    </DataContext.Provider>
  );
}
