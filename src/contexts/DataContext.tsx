import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  datasets,
  PriceRecord,
  AvailabilityRecord,
  SearchRankRecord,
  AssortmentRecord,
} from "@/data/dataLoader";

// ─── Storage base URL ─────────────────────────────────────────────────────────
const STORAGE_BASE =
  "https://izbmztdheugubvkchgiv.supabase.co/storage/v1/object/public/retail-datasets";

// ─── Dataset keys ─────────────────────────────────────────────────────────────
export type DatasetKey =
  | "price_tracking"
  | "availability_tracking"
  | "search_rank_tracking"
  | "assortment_tracking";

// ─── Page → required datasets mapping ────────────────────────────────────────
const PAGE_DATASETS: Record<string, DatasetKey[]> = {
  "/dashboard":           [],                                               // platform_summary only (already local)
  "/dashboard/pricing":   ["price_tracking"],
  "/dashboard/search":    ["search_rank_tracking"],
  "/dashboard/assortment":["assortment_tracking"],
  "/dashboard/availability": ["availability_tracking"],
  "/dashboard/local":     ["price_tracking", "availability_tracking"],
  "/dashboard/events":    [],                                               // competitor_events already local
};

// ─── Context value ────────────────────────────────────────────────────────────
interface DataContextValue {
  /** True once the datasets required for the current page are loaded */
  loaded: boolean;
  /** Set of dataset keys that have been fetched (global cache tracker) */
  loadedDatasets: Set<DatasetKey>;
}

const DataContext = createContext<DataContextValue>({
  loaded: false,
  loadedDatasets: new Set(),
});

export function useData() {
  return useContext(DataContext);
}

// ─── In-memory cache (persists for the lifetime of the browser session) ───────
const fetchedDatasets = new Set<DatasetKey>();
let fetchPromises: Partial<Record<DatasetKey, Promise<void>>> = {};

async function fetchAndHydrate(key: DatasetKey): Promise<void> {
  if (fetchedDatasets.has(key)) return; // already cached

  // Deduplicate concurrent fetches for the same key
  if (!fetchPromises[key]) {
    fetchPromises[key] = (async () => {
      const url = `${STORAGE_BASE}/${key}.json`;
      const data = await fetch(url).then((r) => r.json());
      switch (key) {
        case "price_tracking":
          datasets.priceTracking = data as PriceRecord[];
          break;
        case "availability_tracking":
          datasets.availabilityTracking = data as AvailabilityRecord[];
          break;
        case "search_rank_tracking":
          datasets.searchRankTracking = data as SearchRankRecord[];
          break;
        case "assortment_tracking":
          datasets.assortmentTracking = data as AssortmentRecord[];
          break;
      }
      fetchedDatasets.add(key);
    })();
  }

  return fetchPromises[key];
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function DataProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [loaded, setLoaded] = useState(false);
  const [loadedDatasets, setLoadedDatasets] = useState<Set<DatasetKey>>(new Set(fetchedDatasets));
  const prevPathRef = useRef<string | null>(null);

  const loadForPage = useCallback(async (pathname: string) => {
    const required = PAGE_DATASETS[pathname] ?? [];

    // If all required datasets are already cached, mark loaded immediately
    if (required.every((k) => fetchedDatasets.has(k))) {
      setLoaded(true);
      return;
    }

    setLoaded(false);
    await Promise.all(required.map((k) => fetchAndHydrate(k)));
    setLoadedDatasets(new Set(fetchedDatasets));
    setLoaded(true);
  }, []);

  useEffect(() => {
    const pathname = location.pathname;
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    loadForPage(pathname);
  }, [location.pathname, loadForPage]);

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
    <DataContext.Provider value={{ loaded, loadedDatasets }}>
      {children}
    </DataContext.Provider>
  );
}
