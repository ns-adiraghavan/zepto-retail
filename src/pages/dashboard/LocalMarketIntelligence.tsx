import { KPICard } from "@/components/dashboard/KPICard";
import { GlobalFilters, datasets } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Hash } from "lucide-react";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { SKUCrossPlatformComparison } from "@/components/dashboard/SKUCrossPlatformComparison";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StrategicInsightsPanel, type Insight } from "@/components/dashboard/StrategicInsightsPanel";
import { PageControlBar } from "@/components/dashboard/PageControlBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CITIES = ["Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];

function avg(arr: number[]) {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

/** Population stddev of values */
function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const variance = avg(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

const LocalMarketIntelligence = () => {
  const { city, platform, pincode, category, dateFrom, dateTo } = useOutletContext<GlobalFilters>();

  // ── Local pincode state (page-level, dependent on city) ──────────────────
  const [localPincode, setLocalPincode] = useState<string>("All Pincodes");

  // ── Derive pincodes that belong to the currently selected city ──────────
  const cityPincodes = useMemo(() => {
    const effectiveCity = city !== "All Cities" ? city : null;
    if (!effectiveCity) return [];
    const s = new Set<string>();
    for (const r of datasets.priceTracking) {
      if (r.city === effectiveCity && r.pincode) s.add(String(r.pincode));
    }
    return Array.from(s).sort();
  }, [city]);

  // Local page pincode takes precedence; fall back to global pincode, then "All Pincodes"
  // Variance calculation NEVER uses pincode — only comparison tables do
  const effectivePincode =
    city === "All Cities"
      ? (pincode !== "All Pincodes" ? pincode : "All Pincodes")
      : (localPincode !== "All Pincodes" ? localPincode : pincode !== "All Pincodes" ? pincode : "All Pincodes");

  // ── City-level scores (memoized, independent of city/pincode filter) ─────
  const cityScores = useMemo(() =>
    CITIES.map((c) => {
      const priceRows = datasets.priceTracking.filter((r) => {
        if (r.city !== c) return false;
        if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      });

      const availRows = datasets.availabilityTracking.filter((r) => {
        if (r.city !== c) return false;
        if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      });

      const searchRows = datasets.searchRankTracking.filter((r) => {
        if (r.city !== c) return false;
        if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      });

      const promoRate   = avg(priceRows.map((r) => r.promotion_flag * 100));
      const discount    = avg(priceRows.map((r) => r.discount_percent));
      const availability = avg(availRows.map((r) => r.availability_flag * 100));
      const search      = avg(searchRows.map((r) => (r.top10_flag ?? (r.search_rank <= 10 ? 1 : 0)) * 100));

      // ── FIXED: Group by (pincode, sku_id) → avg price per group → stddev ──
      const bucketMap: Record<string, number[]> = {};
      for (const row of priceRows) {
        const pc = row.pincode ? String(row.pincode) : null;
        if (!pc) continue;
        const key = `${pc}||${row.sku_id}`;
        if (!bucketMap[key]) bucketMap[key] = [];
        bucketMap[key].push(row.sale_price);
      }
      const bucketAvgs = Object.values(bucketMap).map((vals) => avg(vals));
      const priceVariance = parseFloat(stddev(bucketAvgs).toFixed(2));

      const score = parseFloat(
        (0.35 * promoRate + 0.25 * discount + 0.20 * search + 0.20 * availability).toFixed(1)
      );

      return { city: c, availability, discount, promoRate, search, priceVariance, score };
    }),
  [platform, dateFrom, dateTo]);

  // ── Top-5 SKUs by pincode variance (only when city is selected) ──────────
  const top5VarianceSKUs = useMemo(() => {
    const effectiveCity = city !== "All Cities" ? city : null;
    if (!effectiveCity) return [];

    const cityRows = datasets.priceTracking.filter((r) => {
      if (r.city !== effectiveCity) return false;
      if (!r.pincode) return false;
      if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo   && r.date > dateTo)   return false;
      return true;
    });

    if (cityRows.length === 0) return [];

    // Group by (sku_id, pincode) → avg sale price
    const skuPinMap: Record<string, Record<string, number[]>> = {};
    for (const r of cityRows) {
      const pc = String(r.pincode);
      if (!skuPinMap[r.sku_id]) skuPinMap[r.sku_id] = {};
      if (!skuPinMap[r.sku_id][pc]) skuPinMap[r.sku_id][pc] = [];
      skuPinMap[r.sku_id][pc].push(r.sale_price);
    }

    const results = Object.entries(skuPinMap).map(([sku_id, pinMap]) => {
      const pincodeAvgs: Record<string, number> = {};
      for (const [pc, prices] of Object.entries(pinMap)) {
        pincodeAvgs[pc] = avg(prices);
      }
      const entries = Object.entries(pincodeAvgs);
      if (entries.length < 2) return null;

      const sorted = entries.sort((a, b) => a[1] - b[1]);
      const cheapestPincode = sorted[0][0];
      const cheapestPrice   = sorted[0][1];
      const priceyPincode   = sorted[sorted.length - 1][0];
      const priceyPrice     = sorted[sorted.length - 1][1];
      const priceGapPct     = cheapestPrice > 0 ? ((priceyPrice - cheapestPrice) / cheapestPrice) * 100 : 0;

      const skuMeta = datasets.skuMaster.find((s) => s.sku_id === sku_id);
      return {
        sku_id,
        product_name: skuMeta?.product_name ?? sku_id,
        category: skuMeta?.category ?? "—",
        cheapestPincode,
        cheapestPrice,
        priceyPincode,
        priceyPrice,
        priceGapPct,
      };
    }).filter(Boolean) as NonNullable<ReturnType<typeof results[0]>>[];

    return results.sort((a, b) => b.priceGapPct - a.priceGapPct).slice(0, 5);
  }, [city, platform, dateFrom, dateTo]);

  const sortedByScore = [...cityScores].sort((a, b) => b.score - a.score);
  const bestCity = sortedByScore[0];
  const worstCity = sortedByScore[sortedByScore.length - 1];
  const avgScore = avg(cityScores.map((c) => c.score));
  const highestVarianceCity = [...cityScores].sort((a, b) => b.priceVariance - a.priceVariance)[0];

  const kpis = [
    { title: "Market Competition Index", value: avgScore.toFixed(1), trend: "neutral" as const, tooltip: "Market Competition Index: Weighted score (0–100) = 35% Promotion Share + 25% Avg Discount Depth + 20% Top-10 Presence + 20% SKU Availability Rate." },
    { title: "Best Performing City", value: bestCity?.city ?? "—", change: bestCity?.score, changeType: "absolute" as const, trend: "up" as const, tooltip: "City with the highest Market Competition Index score." },
    { title: "Lowest Performing City", value: worstCity?.city ?? "—", change: worstCity?.score, changeType: "absolute" as const, trend: "down" as const, tooltip: "City with the lowest Market Competition Index score." },
    { title: "Hyperlocal Price Variance", value: highestVarianceCity ? `₹${highestVarianceCity.priceVariance}` : "—", trend: highestVarianceCity?.priceVariance > 4 ? "down" as const : "neutral" as const, tooltip: `Hyperlocal Price Variance: Std-dev of avg sale prices grouped by (pincode × SKU). Higher = inconsistent local pricing. ${highestVarianceCity?.city ?? "—"} leads.` },
  ];

  const cityChartData = cityScores.map((c) => ({
    city: c.city,
    "Market Competition Index": c.score,
    "SKU Availability Rate": parseFloat(c.availability.toFixed(1)),
    "Top-10 Presence": parseFloat(c.search.toFixed(1)),
    "Price Competitiveness": parseFloat((100 - c.discount).toFixed(1)),
  }));

  // ── Strategic Insights ──────────────────────────────────────────────────
  const topCity = sortedByScore[0];
  const lowestAvailCity = [...cityScores].sort((a, b) => a.availability - b.availability)[0];
  const highPromoCity = [...cityScores].sort((a, b) => b.promoRate - a.promoRate)[0];

  // Pincode-level insight when city + pincode are both set
  const pincodeInsight: Insight | null = useMemo(() => {
    if (city === "All Cities" || effectivePincode === "All Pincodes") return null;
    const rows = datasets.priceTracking.filter((r) => {
      if (r.city !== city) return false;
      if (String(r.pincode) !== effectivePincode) return false;
      if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
      return true;
    });
    if (rows.length === 0) return null;
    const avgPrice = avg(rows.map((r) => r.sale_price));
    const promoRate = avg(rows.map((r) => r.promotion_flag)) * 100;
    return {
      icon: "pin",
      title: `Pincode ${effectivePincode} Snapshot`,
      body: `${effectivePincode} (${city}): avg sale price ₹${avgPrice.toFixed(0)}, ${promoRate.toFixed(1)}% of SKUs on promotion across ${rows.length} price records.`,
      type: "neutral" as const,
    };
  }, [city, effectivePincode, platform]);

  const insights: Insight[] = [
    ...(pincodeInsight ? [pincodeInsight] : []),
    topCity
      ? { icon: "pin", title: "Most Competitive City", body: `${topCity.city} leads with a Market Competition Index of ${topCity.score}/100 — driven by promo intensity (${topCity.promoRate.toFixed(1)}%), avg discount (${topCity.discount.toFixed(1)}%), and ${topCity.availability.toFixed(0)}% SKU availability.`, type: "positive" as const }
      : { icon: "pin", title: "Most Competitive City", body: "No city data available.", type: "neutral" as const },
    highestVarianceCity
      ? { icon: "tag", title: "Hyperlocal Price Hotspot", body: `${highestVarianceCity.city} shows the highest price dispersion (₹${highestVarianceCity.priceVariance} std-dev across pincode × SKU groups), indicating uneven local pricing that may signal differential trade terms.`, type: highestVarianceCity.priceVariance > 5 ? "warning" as const : "neutral" as const }
      : { icon: "tag", title: "Hyperlocal Price Hotspot", body: "No variance data available.", type: "neutral" as const },
    lowestAvailCity
      ? { icon: "trend-down", title: "Regional Availability Gap", body: `${lowestAvailCity.city} has the lowest SKU Availability Rate at ${lowestAvailCity.availability.toFixed(1)}%, suggesting elevated stockout risk vs the ${avgScore.toFixed(1)} avg across all cities.`, type: lowestAvailCity.availability < 80 ? "critical" as const : "warning" as const }
      : { icon: "trend-down", title: "Regional Availability Gap", body: "No availability data available.", type: "neutral" as const },
    highPromoCity
      ? { icon: "tag", title: "Highest Promo Intensity", body: `${highPromoCity.city} has the most promotional activity at ${highPromoCity.promoRate.toFixed(1)}% promo rate — monitor for margin pressure.`, type: "warning" as const }
      : { icon: "tag", title: "Highest Promo Intensity", body: "No promo data.", type: "neutral" as const },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Local Market Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            City-level deep dives: Bangalore · Mumbai · Delhi NCR · Pune · Hyderabad
          </p>
        </div>
      </div>

      <PageControlBar exportLabel="local_market_intelligence" exportData={cityScores as unknown as Record<string, unknown>[]} />

      {/* ── Pincode Drill-down Filter ── */}
      {city !== "All Cities" && cityPincodes.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{city}</span>
            <span className="text-border">→</span>
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <Select
            value={effectivePincode}
            onValueChange={(v) => setLocalPincode(v)}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-[160px] bg-background border-border">
              <SelectValue placeholder="All Pincodes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Pincodes" className="text-xs">All Pincodes</SelectItem>
              {cityPincodes.map((pc) => (
                <SelectItem key={pc} value={pc} className="text-xs font-mono">{pc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {effectivePincode !== "All Pincodes" && (
            <span className="text-xs text-muted-foreground">
              Filtering Hyperlocal Price Competition and SKU Comparison by pincode {effectivePincode}
            </span>
          )}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </section>

      <StrategicInsightsPanel insights={insights} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">City Market Competition Index</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>City Market Competition Index</CardTitle>
            <CardDescription>Market Competition Index, SKU Availability Rate, Top-10 Presence, and Price Competitiveness per city</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cityChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Market Competition Index" fill="hsl(var(--status-low))"    radius={[4, 4, 0, 0]} />
                <Bar dataKey="SKU Availability Rate"   fill="hsl(221 83% 53%)"          radius={[4, 4, 0, 0]} />
                <Bar dataKey="Top-10 Presence"         fill="hsl(270 70% 55%)"          radius={[4, 4, 0, 0]} />
                <Bar dataKey="Price Competitiveness"   fill="hsl(var(--status-medium))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hyperlocal Price Variance by City</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Hyperlocal Price Variance</CardTitle>
            <CardDescription>Std-dev of avg sale price grouped by (pincode × SKU) — higher values indicate cities with inconsistent local pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...cityScores].sort((a, b) => b.priceVariance - a.priceVariance).map((c) => {
                const maxVariance = Math.max(...cityScores.map((x) => x.priceVariance), 1);
                const pct = Math.round((c.priceVariance / maxVariance) * 100);
                const color = c.priceVariance > 5 ? "bg-status-high" : c.priceVariance > 3 ? "bg-status-medium" : "bg-status-low";
                return (
                  <div key={c.city} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{c.city}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">₹{c.priceVariance}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Top-5 SKUs by Pincode Variance (shown when city selected, no product chosen yet) ── */}
      {city !== "All Cities" && top5VarianceSKUs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Top 5 SKUs by Hyperlocal Price Gap · {city}
            {effectivePincode !== "All Pincodes" && ` · ${effectivePincode}`}
          </h2>
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Highest Pincode Price Dispersion
              </CardTitle>
              <CardDescription>
                SKUs with the largest price gap between their cheapest and most expensive pincodes in {city}. Select a product in the comparison below to drill deeper.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        { label: "SKU", align: "left" },
                        { label: "Category", align: "left" },
                        { label: "Cheapest Pincode", align: "left" },
                        { label: "Most Expensive Pincode", align: "left" },
                        { label: "Price Gap %", align: "right" },
                      ].map((h) => (
                        <th key={h.label} className={`py-2 px-3 font-medium text-muted-foreground text-xs text-${h.align}`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top5VarianceSKUs.map((row, i) => (
                      <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-xs max-w-[220px] truncate">{row.product_name}</td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">{row.category}</td>
                        <td className="py-2.5 px-3 text-xs">
                          <span className="font-mono">{row.cheapestPincode}</span>
                          <span className="text-muted-foreground ml-1">₹{row.cheapestPrice.toFixed(0)}</span>
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          <span className="font-mono">{row.priceyPincode}</span>
                          <span className="text-muted-foreground ml-1">₹{row.priceyPrice.toFixed(0)}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`text-xs font-semibold ${row.priceGapPct >= 10 ? "text-status-high" : row.priceGapPct >= 5 ? "text-status-medium" : "text-muted-foreground"}`}>
                            +{row.priceGapPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <SKUCrossPlatformComparison
        filters={{ city, pincode: effectivePincode, category, dateFrom, dateTo }}
        mode="hyperlocal"
      />
    </div>
  );
};

export default LocalMarketIntelligence;
