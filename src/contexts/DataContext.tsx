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
// Each entry lists EVERY dataset the page (and its sub-components) touches.
const PAGE_DATASETS: Record<string, DatasetKey[]> = {
  // Competitive Overview: KPI cards + heatmaps use ALL four tracking datasets
  "/dashboard": [
    "price_tracking",
    "availability_tracking",
    "search_rank_tracking",
    "assortment_tracking",
  ],
  // Pricing: price only (SKUCrossPlatformComparison also only needs price)
  "/dashboard/pricing": ["price_tracking"],
  // Search: search_rank only
  "/dashboard/search": ["search_rank_tracking"],
  // Assortment: uses datasets.assortmentTracking directly — must be loaded
  "/dashboard/assortment": ["assortment_tracking"],
  // Availability: availability only
  "/dashboard/availability": ["availability_tracking"],
  // Local Market: directly accesses datasets.priceTracking, datasets.availabilityTracking,
  // and datasets.searchRankTracking — all three must be loaded
  "/dashboard/local": [
    "price_tracking",
    "availability_tracking",
    "search_rank_tracking",
  ],
  // Competitive Events: competitor_events + platform_summary are already local (no fetch needed)
  "/dashboard/events": [],
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
      const storageUrl = `${STORAGE_BASE}/${key}.json`;
      const localUrl   = `/data/${key}.json`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let raw: any[];
      try {
        const res = await fetch(storageUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Guard against redirect stubs like {"_fetch_from": "..."} returned with 200
        if (!Array.isArray(json)) throw new Error("Storage returned non-array (stub or redirect)");
        raw = json;
      } catch {
        // Fall back to local public file
        const localRes = await fetch(localUrl);
        if (!localRes.ok) throw new Error(`Local fallback failed: ${localRes.status}`);
        const localJson = await localRes.json();
        if (!Array.isArray(localJson)) throw new Error("Local fallback also returned non-array");
        raw = localJson;
      }

      // Normalize pincode to string for every dataset so that filters
      // and grouping logic can do reliable string comparisons.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalize = (rows: any[]) =>
        rows.map((r) =>
          r.pincode != null ? { ...r, pincode: String(r.pincode) } : r
        );

      switch (key) {
        case "price_tracking":
          datasets.priceTracking = normalize(raw) as PriceRecord[];
          break;
        case "availability_tracking":
          datasets.availabilityTracking = normalize(raw) as AvailabilityRecord[];
          break;
        case "search_rank_tracking":
          datasets.searchRankTracking = normalize(raw) as SearchRankRecord[];
          break;
        case "assortment_tracking":
          datasets.assortmentTracking = normalize(raw) as AssortmentRecord[];
          break;
      }
      fetchedDatasets.add(key);
    })().catch((err) => {
      // Clear the failed promise so it can be retried on next navigation
      delete fetchPromises[key];
      throw err;
    });
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
