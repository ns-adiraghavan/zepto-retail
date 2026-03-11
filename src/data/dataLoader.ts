import skuMaster from "./sku_master.json";
import assortmentTracking from "./assortment_tracking.json";
import priceTracking from "./price_tracking.json";
import availabilityTracking from "./availability_tracking.json";
import searchRankTracking from "./search_rank_tracking.json";
import platformSummary from "./platform_summary.json";
import competitorEvents from "./competitor_events.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SKUMaster {
  sku_id: string;
  product_name: string;
  brand: string;
  category: string;
  subcategory: string;
  pack_size: string;
}

export interface AssortmentRecord {
  sku_id: string;
  brand: string;
  category: string;
  product_name: string;
  platform: string;
  city: string;
  listing_status: number;
  first_seen_date: string;
}

export interface PriceRecord {
  date: string;
  sku_id: string;
  brand: string;
  category: string;
  product_name: string;
  platform: string;
  city: string;
  mrp: number;
  sale_price: number;
  discount_percent: number;
  promotion_flag: number;
}

export interface AvailabilityRecord {
  date: string;
  sku_id: string;
  brand: string;
  category: string;
  product_name: string;
  platform: string;
  city: string;
  availability_flag: number;
}

export interface SearchRankRecord {
  date: string;
  keyword: string;
  platform: string;
  city: string;
  sku_id: string;
  brand: string;
  category: string;
  product_name: string;
  search_rank: number;
  sponsored_flag: number;
}

export interface PlatformSummary {
  platform: string;
  price_index: number;
  availability_rate: number;
  search_visibility: number;
  sku_count: number;
  competitiveness_score: number;
}

export interface CompetitorEvent {
  event_id: string;
  date: string;
  platform: string;
  city: string;
  event_type: string;
  category: string;
  description: string;
  discount_percent: number;
}

// ─── Raw dataset bundle ───────────────────────────────────────────────────────

export const datasets = {
  skuMaster: skuMaster as SKUMaster[],
  assortmentTracking: assortmentTracking as AssortmentRecord[],
  priceTracking: priceTracking as PriceRecord[],
  availabilityTracking: availabilityTracking as AvailabilityRecord[],
  searchRankTracking: searchRankTracking as SearchRankRecord[],
  platformSummary: platformSummary as PlatformSummary[],
  competitorEvents: competitorEvents as CompetitorEvent[],
};

// ─── Generic context filter ───────────────────────────────────────────────────

export function filterByContext<T extends { city?: string; platform?: string }>(
  data: T[],
  city: string,
  platform: string
): T[] {
  return data.filter(
    (row) =>
      (city === "All Cities" || row.city === city) &&
      (platform === "All Platforms" || row.platform === platform)
  );
}

// ─── Module-specific helpers ──────────────────────────────────────────────────

export const getPriceData = (city: string, platform: string): PriceRecord[] =>
  filterByContext(datasets.priceTracking, city, platform);

export const getAvailabilityData = (
  city: string,
  platform: string
): AvailabilityRecord[] =>
  filterByContext(datasets.availabilityTracking, city, platform);

export const getSearchData = (
  city: string,
  platform: string
): SearchRankRecord[] =>
  filterByContext(datasets.searchRankTracking, city, platform);

export const getAssortmentData = (
  city: string,
  platform: string
): AssortmentRecord[] =>
  filterByContext(datasets.assortmentTracking, city, platform);

export const getPlatformSummary = (): PlatformSummary[] =>
  datasets.platformSummary;

export const getEvents = (
  city = "All Cities",
  platform = "All Platforms"
): CompetitorEvent[] =>
  filterByContext(datasets.competitorEvents, city, platform);

// ─── Convenience aggregators ──────────────────────────────────────────────────

/** Average availability rate per platform for a given city */
export function getAvailabilityByPlatform(
  city: string
): { platform: string; rate: number }[] {
  const data = filterByContext(datasets.availabilityTracking, city, "All Platforms");
  const totals: Record<string, { sum: number; count: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { sum: 0, count: 0 };
    totals[row.platform].sum += row.availability_flag;
    totals[row.platform].count += 1;
  }
  return Object.entries(totals).map(([platform, { sum, count }]) => ({
    platform,
    rate: Math.round((sum / count) * 100),
  }));
}

/** Average discount % per platform for a given city */
export function getDiscountByPlatform(
  city: string,
  platform = "All Platforms"
): { platform: string; avgDiscount: number }[] {
  const data = filterByContext(datasets.priceTracking, city, platform);
  const totals: Record<string, { sum: number; count: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { sum: 0, count: 0 };
    totals[row.platform].sum += row.discount_percent;
    totals[row.platform].count += 1;
  }
  return Object.entries(totals).map(([p, { sum, count }]) => ({
    platform: p,
    avgDiscount: parseFloat((sum / count).toFixed(2)),
  }));
}

/** Sponsored search share per platform for a given city */
export function getSponsoredShareByPlatform(
  city: string,
  platform = "All Platforms"
): { platform: string; sponsoredShare: number }[] {
  const data = filterByContext(datasets.searchRankTracking, city, platform);
  const totals: Record<string, { sponsored: number; total: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { sponsored: 0, total: 0 };
    totals[row.platform].sponsored += row.sponsored_flag;
    totals[row.platform].total += 1;
  }
  return Object.entries(totals).map(([p, { sponsored, total }]) => ({
    platform: p,
    sponsoredShare: parseFloat(((sponsored / total) * 100).toFixed(1)),
  }));
}

/** Listed SKU count per platform for a given city */
export function getListingCountByPlatform(
  city: string,
  platform = "All Platforms"
): { platform: string; listed: number; notListed: number }[] {
  const data = filterByContext(datasets.assortmentTracking, city, platform);
  const totals: Record<string, { listed: number; notListed: number }> = {};
  for (const row of data) {
    if (!totals[row.platform]) totals[row.platform] = { listed: 0, notListed: 0 };
    if (row.listing_status === 1) totals[row.platform].listed += 1;
    else totals[row.platform].notListed += 1;
  }
  return Object.entries(totals).map(([p, counts]) => ({
    platform: p,
    ...counts,
  }));
}
