import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  getEvents,
  getPriceData,
  getSearchData,
  getAvailabilityData,
  GlobalFilters,
} from "@/data/dataLoader";
import { KPICard } from "@/components/dashboard/KPICard";
import { StrategicInsightsPanel, Insight } from "@/components/dashboard/StrategicInsightsPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingDown, Search, ShieldAlert } from "lucide-react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  price_drop: "Price Drop",
  flash_sale: "Flash Sale",
  bundle_offer: "Bundle Offer",
  promo_spike: "Promo Spike",
  stockout_spike: "Stockout Spike",
  new_sku_launch: "New SKU Launch",
};

type SeverityVariant = "destructive" | "secondary" | "outline" | "default";

function severityVariant(eventType: string): SeverityVariant {
  if (["price_drop", "stockout_spike"].includes(eventType)) return "destructive";
  if (["flash_sale", "promo_spike"].includes(eventType)) return "secondary";
  return "outline";
}
function severityLabel(eventType: string): string {
  if (["price_drop", "stockout_spike"].includes(eventType)) return "High";
  if (["flash_sale", "promo_spike"].includes(eventType)) return "Medium";
  return "Low";
}
function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return dateStr; }
}

/** Population standard deviation */
function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function riskBand(ratio: number): { label: string; variant: "destructive" | "secondary" | "outline" } {
  if (ratio < 0.80) return { label: "High Risk", variant: "destructive" };
  if (ratio < 0.90) return { label: "Medium Risk", variant: "secondary" };
  return { label: "Stable", variant: "outline" };
}

const CompetitiveEvents = () => {
  const filters = useOutletContext<GlobalFilters>();

  // ── Section 1: Events ─────────────────────────────────────────────────────
  const events = useMemo(
    () => getEvents(filters).sort((a, b) => b.date.localeCompare(a.date)),
    [filters]
  );

  const priceDrops = events.filter((e) => e.event_type === "price_drop").length;
  const promos = events.filter((e) => ["flash_sale", "bundle_offer", "promo_spike"].includes(e.event_type)).length;
  const stockouts = events.filter((e) => e.event_type === "stockout_spike").length;

  // ── Section 2: Price Volatility ───────────────────────────────────────────
  const priceVolatility = useMemo(() => {
    const priceData = getPriceData(filters);
    const skuPrices: Record<string, { prices: number[]; product_name: string; category: string }> = {};
    for (const row of priceData) {
      if (!skuPrices[row.sku_id]) skuPrices[row.sku_id] = { prices: [], product_name: row.product_name ?? row.sku_id, category: row.category };
      skuPrices[row.sku_id].prices.push(row.sale_price);
    }
    return Object.entries(skuPrices)
      .map(([sku_id, { prices, product_name, category }]) => ({
        sku_id,
        product_name,
        category,
        price_volatility: parseFloat(stddev(prices).toFixed(2)),
      }))
      .sort((a, b) => b.price_volatility - a.price_volatility)
      .slice(0, 10);
  }, [filters]);

  // ── Section 3: Search Rank Volatility ─────────────────────────────────────
  const searchVolatility = useMemo(() => {
    const searchData = getSearchData(filters);
    const kwRanks: Record<string, number[]> = {};
    for (const row of searchData) {
      if (!kwRanks[row.keyword]) kwRanks[row.keyword] = [];
      kwRanks[row.keyword].push(row.search_rank);
    }
    return Object.entries(kwRanks)
      .map(([keyword, ranks]) => ({
        keyword,
        rank_volatility: parseFloat(stddev(ranks).toFixed(2)),
        observations: ranks.length,
      }))
      .sort((a, b) => b.rank_volatility - a.rank_volatility)
      .slice(0, 10);
  }, [filters]);

  // ── Section 4: SKU Availability Risk ─────────────────────────────────────
  const availRisk = useMemo(() => {
    const availData = getAvailabilityData(filters);
    const skuFlags: Record<string, { sum: number; count: number; product_name: string; category: string }> = {};
    for (const row of availData) {
      if (!skuFlags[row.sku_id]) skuFlags[row.sku_id] = { sum: 0, count: 0, product_name: row.product_name ?? row.sku_id, category: row.category };
      skuFlags[row.sku_id].sum += row.availability_flag;
      skuFlags[row.sku_id].count += 1;
    }
    return Object.entries(skuFlags)
      .map(([sku_id, { sum, count, product_name, category }]) => ({
        sku_id,
        product_name,
        category,
        availability_ratio: parseFloat((sum / count).toFixed(3)),
      }))
      .sort((a, b) => a.availability_ratio - b.availability_ratio)
      .slice(0, 20);
  }, [filters]);

  // ── Strategic Insights ────────────────────────────────────────────────────
  const insights = useMemo((): Insight[] => {
    const topVolatileSku = priceVolatility[0];
    const topVolatileKw = searchVolatility[0];
    const highRiskCount = availRisk.filter((s) => s.availability_ratio < 0.80).length;
    const mostFrequentEventType = Object.entries(
      events.reduce<Record<string, number>>((acc, e) => { acc[e.event_type] = (acc[e.event_type] ?? 0) + 1; return acc; }, {})
    ).sort((a, b) => b[1] - a[1])[0];

    const list: Insight[] = [];

    if (topVolatileSku) {
      list.push({
        icon: "trend-down",
        title: "Highest Price Volatility",
        body: `"${topVolatileSku.product_name}" shows the highest price volatility (σ ₹${topVolatileSku.price_volatility}) in the ${topVolatileSku.category} category, signalling aggressive competitor pricing activity.`,
        type: "warning",
      });
    }
    if (topVolatileKw) {
      list.push({
        icon: "search",
        title: "Unstable Search Keyword",
        body: `The keyword "${topVolatileKw.keyword}" has the highest rank volatility (σ ${topVolatileKw.rank_volatility}), meaning search positions are shifting frequently and ad pressure may be intensifying.`,
        type: "warning",
      });
    }
    if (highRiskCount > 0) {
      list.push({
        icon: "shield",
        title: "High-Risk SKU Availability",
        body: `${highRiskCount} SKU${highRiskCount > 1 ? "s are" : " is"} in the High Risk band with availability below 80%, indicating frequent stockouts that competitors may be exploiting.`,
        type: "critical",
      });
    }
    if (mostFrequentEventType) {
      list.push({
        icon: "zap",
        title: "Dominant Event Type",
        body: `"${EVENT_TYPE_LABELS[mostFrequentEventType[0]] ?? mostFrequentEventType[0]}" is the most frequently detected competitive event (${mostFrequentEventType[1]} occurrences), indicating the primary area of market pressure.`,
        type: "neutral",
      });
    }
    return list;
  }, [priceVolatility, searchVolatility, availRisk, events]);

  const kpis = [
    { title: "Events Detected", value: events.length.toString(), trend: "neutral" as const, tooltip: "Total competitive events in the filtered dataset" },
    { title: "Price Drop Alerts", value: priceDrops.toString(), trend: priceDrops > 0 ? "down" as const : "neutral" as const, status: priceDrops > 2 ? "high" as const : "low" as const, tooltip: "Events where a competitor reduced prices" },
    { title: "Promotion Alerts", value: promos.toString(), trend: promos > 0 ? "up" as const : "neutral" as const, status: promos > 3 ? "medium" as const : "low" as const, tooltip: "Flash sales, bundle offers, and promotional spikes" },
    { title: "Stockout Alerts", value: stockouts.toString(), trend: stockouts > 0 ? "down" as const : "neutral" as const, status: stockouts > 1 ? "high" as const : "low" as const, tooltip: "Stockout spike events detected" },
  ];

  const maxVolatility = priceVolatility[0]?.price_volatility ?? 1;
  const maxRankVol = searchVolatility[0]?.rank_volatility ?? 1;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Competitive Risk & Volatility Center</h1>
          <p className="text-sm text-muted-foreground">
            Event monitoring, price & rank volatility, and SKU availability risk across platforms
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </section>

      {/* Strategic Insights */}
      <StrategicInsightsPanel insights={insights} />

      {/* ── Section 1: Event Feed ─────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Event Feed</h2>
        </div>
        <Card className="bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live Event Feed</CardTitle>
            <CardDescription>
              {events.length} event{events.length !== 1 ? "s" : ""} · sorted by newest
              {selectedCity !== "All Cities" ? ` · ${selectedCity}` : ""}
              {selectedPlatform !== "All Platforms" ? ` · ${selectedPlatform}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No events found for the selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["Date", "Platform", "City", "Category", "Event Type", "Severity", "Description"].map((h) => (
                        <th key={h} className="py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e, i) => (
                      <tr key={e.event_id ?? i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="py-2 pr-4 font-medium">{e.platform}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{e.city}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{e.category}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {EVENT_TYPE_LABELS[e.event_type] ?? e.event_type}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={severityVariant(e.event_type)} className="text-xs">
                            {severityLabel(e.event_type)}
                          </Badge>
                        </td>
                        <td className="py-2 text-muted-foreground text-xs max-w-xs">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Section 2: Price Volatility ───────────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Price Volatility Monitor</h2>
        </div>
        <Card className="bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top 10 SKUs by Price Volatility</CardTitle>
            <CardDescription>Standard deviation of sale price across observations (higher = more volatile)</CardDescription>
          </CardHeader>
          <CardContent>
            {priceVolatility.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No price data available for selected filters.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {priceVolatility.map((row, i) => (
                    <div key={row.sku_id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-medium truncate">{row.product_name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">σ ₹{row.price_volatility}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-status-medium transition-all"
                              style={{ width: `${(row.price_volatility / maxVolatility) * 100}%` }}
                            />
                          </div>
                          <Badge variant="outline" className="text-xs py-0 h-5">{row.category}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
                  Higher volatility indicates frequent price changes or aggressive promotion competition.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Section 3: Search Rank Volatility ─────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Search Rank Volatility</h2>
        </div>
        <Card className="bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top 10 Keywords by Rank Volatility</CardTitle>
            <CardDescription>Standard deviation of search rank across observations — high values mean unstable positioning</CardDescription>
          </CardHeader>
          <CardContent>
            {searchVolatility.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No search data available for selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-3 font-medium text-muted-foreground w-8">#</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Keyword</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Rank Volatility (σ)</th>
                      <th className="py-2 font-medium text-muted-foreground text-right">Observations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchVolatility.map((row, i) => (
                      <tr key={row.keyword} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="py-2 pr-4 font-medium">{row.keyword}</td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${(row.rank_volatility / maxRankVol) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono">{row.rank_volatility}</span>
                          </div>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground text-right">{row.observations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Section 4: SKU Availability Risk ─────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">SKU Availability Risk</h2>
        </div>
        <Card className="bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top 20 At-Risk SKUs</CardTitle>
            <CardDescription>SKUs ranked by lowest average availability — High Risk &lt; 80% · Medium Risk 80–90% · Stable ≥ 90%</CardDescription>
          </CardHeader>
          <CardContent>
            {availRisk.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No availability data available for selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-3 font-medium text-muted-foreground w-8">#</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Product Name</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Category</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Availability</th>
                      <th className="py-2 font-medium text-muted-foreground">Risk Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availRisk.map((row, i) => {
                      const band = riskBand(row.availability_ratio);
                      return (
                        <tr key={row.sku_id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{i + 1}</td>
                          <td className="py-2 pr-4 font-medium max-w-[200px] truncate">{row.product_name}</td>
                          <td className="py-2 pr-4 text-xs text-muted-foreground">{row.category}</td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${row.availability_ratio * 100}%`,
                                    backgroundColor:
                                      row.availability_ratio < 0.80
                                        ? "hsl(var(--status-high))"
                                        : row.availability_ratio < 0.90
                                        ? "hsl(var(--status-medium))"
                                        : "hsl(var(--status-low))",
                                  }}
                                />
                              </div>
                              <span className="text-xs font-mono">{(row.availability_ratio * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-2">
                            <Badge variant={band.variant} className="text-xs">{band.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CompetitiveEvents;
