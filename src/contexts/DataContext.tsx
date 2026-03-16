import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import pako from "pako";
import {
  datasets,
  PriceRecord,
  AvailabilityRecord,
  SearchRankRecord,
  AssortmentRecord,
  SKUMaster,
  PlatformSummary,
  CompetitorEvent,
} from "@/data/dataLoader";

// ─── Dataset keys ─────────────────────────────────────────────────────────────
export type DatasetKey =
  | "price_tracking"
  | "availability_tracking"
  | "search_rank_tracking"
  | "assortment_tracking"
  | "sku_master"
  | "platform_summary"
  | "competitor_events";

// ─── Page → required datasets mapping ────────────────────────────────────────
const PAGE_DATASETS: Record<string, DatasetKey[]> = {
  "/dashboard": [
    "sku_master",
    "price_tracking",
    "availability_tracking",
    "search_rank_tracking",
    "assortment_tracking",
    "platform_summary",
  ],
  "/dashboard/pricing": ["sku_master", "price_tracking"],
  "/dashboard/search": ["sku_master", "search_rank_tracking"],
  "/dashboard/assortment": ["sku_master", "assortment_tracking"],
  "/dashboard/availability": ["sku_master", "availability_tracking"],
  "/dashboard/local": [
    "sku_master",
    "price_tracking",
    "availability_tracking",
    "search_rank_tracking",
  ],
  "/dashboard/events": ["sku_master", "competitor_events", "platform_summary"],
};

// ─── Context value ────────────────────────────────────────────────────────────
interface DataContextValue {
  loaded: boolean;
  loadedDatasets: Set<DatasetKey>;
}

const DataContext = createContext<DataContextValue>({
  loaded: false,
  loadedDatasets: new Set(),
});

export function useData() {
  return useContext(DataContext);
}

// ─── In-memory cache ───────────────────────────────────────────────────────────
const fetchedDatasets = new Set<DatasetKey>();
let fetchPromises: Partial<Record<DatasetKey, Promise<void>>> = {};

// ─── Gzip fetch helper ────────────────────────────────────────────────────────
async function fetchGzip(filename: string): Promise<unknown[]> {
  const res = await fetch(`/data/${filename}.json.gz`);
  if (!res.ok) throw new Error(`Failed to fetch ${filename}.json.gz: HTTP ${res.status}`);
  const buffer = await res.arrayBuffer();
  const decompressed = pako.inflate(new Uint8Array(buffer), { to: "string" });
  const json = JSON.parse(decompressed);
  if (!Array.isArray(json)) throw new Error(`${filename}.json.gz did not decompress to an array`);
  return json;
}

// ─── Normalize pincode to string ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizePincode = (rows: any[]) =>
  rows.map((r) => (r.pincode != null ? { ...r, pincode: String(r.pincode) } : r));

async function fetchAndHydrate(key: DatasetKey): Promise<void> {
  if (fetchedDatasets.has(key)) return;

  if (!fetchPromises[key]) {
    fetchPromises[key] = (async () => {
      const raw = await fetchGzip(key);

      switch (key) {
        case "price_tracking":
          datasets.priceTracking = normalizePincode(raw) as PriceRecord[];
          break;
        case "availability_tracking":
          datasets.availabilityTracking = normalizePincode(raw) as AvailabilityRecord[];
          break;
        case "search_rank_tracking":
          datasets.searchRankTracking = normalizePincode(raw) as SearchRankRecord[];
          break;
        case "assortment_tracking":
          datasets.assortmentTracking = normalizePincode(raw) as AssortmentRecord[];
          break;
        case "sku_master":
          datasets.skuMaster = raw as SKUMaster[];
          break;
        case "platform_summary":
          datasets.platformSummary = raw as PlatformSummary[];
          break;
        case "competitor_events":
          datasets.competitorEvents = normalizePincode(raw) as CompetitorEvent[];
          break;
      }
      fetchedDatasets.add(key);
    })().catch((err) => {
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
