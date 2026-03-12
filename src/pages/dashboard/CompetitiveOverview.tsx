import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useOutletContext } from "react-router-dom";
import { KPICard } from "@/components/dashboard/KPICard";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";
import {
  getPriceData,
  getAvailabilityData,
  getSearchData,
  getAssortmentData,
} from "@/data/dataLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import platformSummaryRaw from "@/data/platform_summary.json";

interface DashboardContext {
  selectedCity: string;
  selectedPlatform: string;
}

const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

// ─── Price gap helpers ────────────────────────────────────────────────────────
// Computes per-platform price gap as % deviation from the cross-platform avg
// sale price for each SKU, then averages across all rows for a platform.
function computePriceGapByPlatform(
  priceData: ReturnType<typeof getPriceData>
): Record<string, number> {
  // Build avg sale_price per sku across all platforms in the dataset
  const skuAvg: Record<string, { sum: number; count: number }> = {};
  for (const row of priceData) {
    if (!skuAvg[row.sku_id]) skuAvg[row.sku_id] = { sum: 0, count: 0 };
    skuAvg[row.sku_id].sum += row.sale_price;
    skuAvg[row.sku_id].count++;
  }

  const platformGap: Record<string, { sum: number; count: number }> = {};
  for (const row of priceData) {
    const avg = skuAvg[row.sku_id];
    if (!avg || avg.count === 0) continue;
    const avgPrice = avg.sum / avg.count;
    if (avgPrice === 0) continue;
    const gap = ((row.sale_price - avgPrice) / avgPrice) * 100;
    if (!platformGap[row.platform]) platformGap[row.platform] = { sum: 0, count: 0 };
    platformGap[row.platform].sum += gap;
    platformGap[row.platform].count++;
  }

  const result: Record<string, number> = {};
  for (const [platform, { sum, count }] of Object.entries(platformGap)) {
    result[platform] = count > 0 ? sum / count : 0;
  }
  return result;
}

const CompetitiveOverview = () => {
  const { selectedCity, selectedPlatform } = useOutletContext<DashboardContext>();

  // ── Raw datasets ──────────────────────────────────────────────────────────
  const priceData = useMemo(
    () => getPriceData(selectedCity, "All Platforms"),
    [selectedCity]
  );
  const availData = useMemo(
    () => getAvailabilityData(selectedCity, "All Platforms"),
    [selectedCity]
  );
  const searchData = useMemo(
    () => getSearchData(selectedCity, "All Platforms"),
    [selectedCity]
  );
  const assortmentData = useMemo(
    () => getAssortmentData(selectedCity, "All Platforms"),
    [selectedCity]
  );

  // ── Price gap per platform ────────────────────────────────────────────────
  const priceGapByPlatform = useMemo(
    () => computePriceGapByPlatform(priceData),
    [priceData]
  );

  // ── Availability rate per platform ────────────────────────────────────────
  const availByPlatform = useMemo(() => {
    const totals: Record<string, { sum: number; count: number }> = {};
    for (const row of availData) {
      if (!totals[row.platform]) totals[row.platform] = { sum: 0, count: 0 };
      totals[row.platform].sum += row.availability_flag;
      totals[row.platform].count++;
    }
    const result: Record<string, number> = {};
    for (const [p, { sum, count }] of Object.entries(totals)) {
      result[p] = count > 0 ? (sum / count) * 100 : 0;
    }
    return result;
  }, [availData]);

  // ── Page-1 search presence per platform ──────────────────────────────────
  const searchByPlatform = useMemo(() => {
    const totals: Record<string, { page1: number; total: number }> = {};
    for (const row of searchData) {
      if (!totals[row.platform]) totals[row.platform] = { page1: 0, total: 0 };
      totals[row.platform].total++;
      if (row.search_rank <= 10) totals[row.platform].page1++;
    }
    const result: Record<string, number> = {};
    for (const [p, { page1, total }] of Object.entries(totals)) {
      result[p] = total > 0 ? (page1 / total) * 100 : 0;
    }
    return result;
  }, [searchData]);

  // ── Assortment coverage per platform ─────────────────────────────────────
  const assortByPlatform = useMemo(() => {
    const totals: Record<string, { listed: number; total: number }> = {};
    for (const row of assortmentData) {
      if (!totals[row.platform]) totals[row.platform] = { listed: 0, total: 0 };
      totals[row.platform].total++;
      if (row.listing_status === 1) totals[row.platform].listed++;
    }
    const result: Record<string, number> = {};
    for (const [p, { listed, total }] of Object.entries(totals)) {
      result[p] = total > 0 ? (listed / total) * 100 : 0;
    }
    return result;
  }, [assortmentData]);

  // ── Composite platform scores ─────────────────────────────────────────────
  // price competitiveness = 100 - clamp(avgGap, 0, 100)  [lower gap = better]
  // availability = raw %
  // search = page1 presence %
  // assortment = coverage %
  const platformScores = useMemo(() => {
    return PLATFORMS.map((platform) => {
      const gap = priceGapByPlatform[platform] ?? 0;
      const priceComp = Math.max(0, Math.min(100, 100 - Math.abs(gap) * 2));
      const avail = availByPlatform[platform] ?? 0;
      const search = searchByPlatform[platform] ?? 0;
      const assort = assortByPlatform[platform] ?? 0;

      const score = Math.round(
        priceComp * 0.35 + avail * 0.25 + search * 0.20 + assort * 0.20
      );
      return { platform, score, priceComp, avail, search, assort, gap };
    });
  }, [priceGapByPlatform, availByPlatform, searchByPlatform, assortByPlatform]);

  // ── KPI 1: Competitive Score ──────────────────────────────────────────────
  const avgCompetitiveness =
    platformScores.length > 0
      ? Math.round(platformScores.reduce((s, p) => s + p.score, 0) / platformScores.length)
      : 0;

  // ── KPI 2: Price Gap vs Market ────────────────────────────────────────────
  const avgPriceGap = useMemo(() => {
    const all = priceData;
    if (all.length === 0) return 0;
    const skuAvg: Record<string, { sum: number; count: number }> = {};
    for (const row of all) {
      if (!skuAvg[row.sku_id]) skuAvg[row.sku_id] = { sum: 0, count: 0 };
      skuAvg[row.sku_id].sum += row.sale_price;
      skuAvg[row.sku_id].count++;
    }
    let gapSum = 0;
    let gapCount = 0;
    for (const row of all) {
      const avg = skuAvg[row.sku_id];
      if (!avg || avg.count < 2) continue;
      const avgPrice = avg.sum / avg.count;
      if (avgPrice === 0) continue;
      gapSum += ((row.sale_price - avgPrice) / avgPrice) * 100;
      gapCount++;
    }
    return gapCount > 0 ? gapSum / gapCount : 0;
  }, [priceData]);

  // ── KPI 3: Availability Gap ───────────────────────────────────────────────
  const availRates = PLATFORMS.map((p) => availByPlatform[p] ?? 0).filter((r) => r > 0);
  const availabilityGap =
    availRates.length > 1 ? Math.max(...availRates) - Math.min(...availRates) : 0;

  // ── KPI 4: Search Visibility Leader ──────────────────────────────────────
  const searchLeader = PLATFORMS.reduce(
    (best, p) =>
      (searchByPlatform[p] ?? 0) > (searchByPlatform[best] ?? 0) ? p : best,
    PLATFORMS[0]
  );
  const searchLeaderScore = searchByPlatform[searchLeader] ?? 0;

  const liveKPIs = [
    {
      title: "Competitive Score",
      value: `${avgCompetitiveness}/100`,
      change: 0,
      trend: "neutral" as const,
      status: avgCompetitiveness >= 70 ? ("low" as const) : ("medium" as const),
      tooltip:
        "Weighted composite (price 35%, availability 25%, search 20%, assortment 20%) across platforms.",
    },
    {
      title: "Price Gap vs Market",
      value: `${avgPriceGap >= 0 ? "+" : ""}${avgPriceGap.toFixed(1)}%`,
      change: 0,
      trend: avgPriceGap > 0 ? ("down" as const) : ("up" as const),
      status: Math.abs(avgPriceGap) > 5 ? ("medium" as const) : ("low" as const),
      tooltip: "Avg % deviation of each platform's sale price from the cross-platform SKU mean.",
    },
    {
      title: "Availability Gap",
      value: `${availabilityGap.toFixed(1)}pp`,
      change: 0,
      trend: availabilityGap > 5 ? ("down" as const) : ("neutral" as const),
      status: availabilityGap > 5 ? ("medium" as const) : ("low" as const),
      tooltip: "Percentage-point spread between best and worst platform availability rates.",
    },
    {
      title: "Search Visibility Leader",
      value: searchLeader,
      change: parseFloat(searchLeaderScore.toFixed(1)),
      trend: "up" as const,
      status: "low" as const,
      tooltip: `Platform with the highest share of page-1 search results (rank ≤ 10). Score: ${searchLeaderScore.toFixed(1)}%`,
    },
  ];

  // ── Score bar color ───────────────────────────────────────────────────────
  const scoreColor = (score: number) => {
    if (score >= 70) return "bg-status-low";
    if (score >= 50) return "bg-status-medium";
    return "bg-status-high";
  };

  // ── Heatmap: category × platform price gap ────────────────────────────────
  const heatmapData = useMemo(() => {
    // per (category, platform) → avg sale_price
    const catPlatAvg: Record<string, Record<string, { sum: number; count: number }>> = {};
    for (const row of priceData) {
      if (!catPlatAvg[row.category]) catPlatAvg[row.category] = {};
      if (!catPlatAvg[row.category][row.platform])
        catPlatAvg[row.category][row.platform] = { sum: 0, count: 0 };
      catPlatAvg[row.category][row.platform].sum += row.sale_price;
      catPlatAvg[row.category][row.platform].count++;
    }

    return Object.entries(catPlatAvg)
      .map(([category, platMap]) => {
        // overall avg for this category across all platforms
        let totalSum = 0;
        let totalCount = 0;
        for (const { sum, count } of Object.values(platMap)) {
          totalSum += sum;
          totalCount += count;
        }
        const categoryAvg = totalCount > 0 ? totalSum / totalCount : 0;

        const platforms = PLATFORMS.map((p) => {
          const d = platMap[p];
          const platAvg = d ? d.sum / d.count : categoryAvg;
          const priceGap = categoryAvg > 0 ? ((platAvg - categoryAvg) / categoryAvg) * 100 : 0;
          return {
            name: p,
            priceGap: parseFloat(priceGap.toFixed(1)),
          };
        });

        return { category, platforms };
      })
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [priceData]);

  // Cell coloring based on price gap thresholds
  const heatmapCellColor = (gap: number) => {
    if (gap <= -5) return "bg-status-low";
    if (gap <= 5) return "bg-status-medium";
    if (gap <= 15) return "bg-status-high";
    return "bg-status-critical";
  };
  const heatmapLabel = (gap: number) => {
    if (gap <= -5) return "Competitive";
    if (gap <= 5) return "Moderate";
    if (gap <= 15) return "At Risk";
    return "Critical";
  };

  // ── Top 10 SKUs by positive price gap ────────────────────────────────────
  const topPriceGapSKUs = useMemo(() => {
    // Compute per-SKU avg across all platforms
    const skuAvg: Record<string, { sum: number; count: number; product_name: string; category: string }> = {};
    for (const row of priceData) {
      if (!skuAvg[row.sku_id]) skuAvg[row.sku_id] = { sum: 0, count: 0, product_name: row.product_name, category: row.category };
      skuAvg[row.sku_id].sum += row.sale_price;
      skuAvg[row.sku_id].count++;
    }

    // Per (sku, platform) avg
    const skuPlatAvg: Record<string, Record<string, { sum: number; count: number }>> = {};
    for (const row of priceData) {
      if (!skuPlatAvg[row.sku_id]) skuPlatAvg[row.sku_id] = {};
      if (!skuPlatAvg[row.sku_id][row.platform])
        skuPlatAvg[row.sku_id][row.platform] = { sum: 0, count: 0 };
      skuPlatAvg[row.sku_id][row.platform].sum += row.sale_price;
      skuPlatAvg[row.sku_id][row.platform].count++;
    }

    const items: {
      sku_id: string;
      product_name: string;
      category: string;
      platform: string;
      platformPrice: number;
      competitorAvg: number;
      gapPct: number;
    }[] = [];

    for (const [skuId, platMap] of Object.entries(skuPlatAvg)) {
      const meta = skuAvg[skuId];
      if (!meta) continue;
      const overallAvg = meta.sum / meta.count;

      for (const [platform, { sum, count }] of Object.entries(platMap)) {
        const platAvg = sum / count;
        if (overallAvg === 0) continue;
        const gapPct = ((platAvg - overallAvg) / overallAvg) * 100;
        if (gapPct > 0) {
          items.push({
            sku_id: skuId,
            product_name: meta.product_name,
            category: meta.category,
            platform,
            platformPrice: platAvg,
            competitorAvg: overallAvg,
            gapPct,
          });
        }
      }
    }

    return items.sort((a, b) => b.gapPct - a.gapPct).slice(0, 10);
  }, [priceData]);

  // ── Category Price Pressure vs Market (Zepto vs competitors) ─────────────
  const categoryPricePressure = useMemo(() => {
    const catData: Record<
      string,
      { zeptoSum: number; zeptoCount: number; compSum: number; compCount: number }
    > = {};

    for (const row of priceData) {
      if (!catData[row.category]) {
        catData[row.category] = { zeptoSum: 0, zeptoCount: 0, compSum: 0, compCount: 0 };
      }
      if (row.platform === "Zepto") {
        catData[row.category].zeptoSum += row.sale_price;
        catData[row.category].zeptoCount++;
      } else {
        catData[row.category].compSum += row.sale_price;
        catData[row.category].compCount++;
      }
    }

    return Object.entries(catData)
      .filter(([, d]) => d.zeptoCount > 0 && d.compCount > 0)
      .map(([category, d]) => {
        const zeptoAvg = d.zeptoSum / d.zeptoCount;
        const compAvg = d.compSum / d.compCount;
        const gapPct = parseFloat(((compAvg - zeptoAvg) / zeptoAvg * 100).toFixed(1));
        return {
          category,
          zepto_avg_price: parseFloat(zeptoAvg.toFixed(2)),
          competitor_avg_price: parseFloat(compAvg.toFixed(2)),
          price_gap_pct: gapPct,
        };
      })
      .sort((a, b) => Math.abs(b.price_gap_pct) - Math.abs(a.price_gap_pct))
      .slice(0, 6);
  }, [priceData]);

  const getRiskLevel = (gap: number): "Critical" | "High" | "Medium" | "Low" => {
    if (gap > 15) return "Critical";
    if (gap > 10) return "High";
    if (gap > 5) return "Medium";
    return "Low";
  };

  const getRiskColor = (risk: "Critical" | "High" | "Medium" | "Low") => {
    switch (risk) {
      case "Critical": return "text-status-critical bg-status-critical/10 border-status-critical/20";
      case "High": return "text-status-high bg-status-high/10 border-status-high/20";
      case "Medium": return "text-status-medium bg-status-medium/10 border-status-medium/20";
      default: return "text-status-low bg-status-low/10 border-status-low/20";
    }
  };

  const getRiskBadgeVariant = (risk: "Critical" | "High" | "Medium" | "Low") =>
    risk === "Critical" || risk === "High" ? ("destructive" as const) : risk === "Medium" ? ("secondary" as const) : ("outline" as const);

  return (
    <TooltipProvider>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Competitive Overview</h1>
            <p className="text-sm text-muted-foreground">
              Cross-platform snapshot: Zepto · Blinkit · Swiggy Instamart · BigBasket Now
            </p>
          </div>
        </div>

        {/* KPI Summary */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveKPIs.map((kpi, i) => (
              <KPICard key={i} {...kpi} />
            ))}
          </div>
        </section>

        {/* Category Price Competitiveness Heatmap */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Category Price Competitiveness
          </h2>
          <Card className="bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Category Price Competitiveness Heatmap</CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  {[
                    { label: "Competitive", cls: "bg-status-low" },
                    { label: "Moderate", cls: "bg-status-medium" },
                    { label: "At Risk", cls: "bg-status-high" },
                    { label: "Critical", cls: "bg-status-critical" },
                  ].map(({ label, cls }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${cls}`} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {heatmapData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Category</th>
                        {PLATFORMS.map((p) => (
                          <th key={p} className="text-center py-2 px-4 font-medium text-muted-foreground min-w-[120px]">
                            {p}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.map((row) => (
                        <tr key={row.category} className="border-b border-border/50">
                          <td className="py-3 px-4 font-medium text-sm">{row.category}</td>
                          {row.platforms.map((cell) => (
                            <td key={cell.name} className="p-2 text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`rounded-lg p-3 ${heatmapCellColor(cell.priceGap)} text-white font-medium transition-all hover:scale-105 cursor-pointer`}
                                  >
                                    <div className="text-sm font-bold">
                                      {cell.priceGap > 0 ? "+" : ""}{cell.priceGap}%
                                    </div>
                                    <div className="text-xs opacity-90">{heatmapLabel(cell.priceGap)}</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="p-3 max-w-[200px]">
                                  <div className="text-sm font-semibold mb-1">{cell.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Price gap vs category avg: <span className="font-medium text-foreground">{cell.priceGap > 0 ? "+" : ""}{cell.priceGap}%</span>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Category Price Pressure vs Market */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Category Price Pressure vs Market
          </h2>
          <Card className="bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Category Price Pressure vs Market</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Zepto vs competitor avg — positive = Zepto cheaper, negative = Zepto pricier
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-status-low" />
                    <span className="text-muted-foreground">Zepto cheaper</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-status-high" />
                    <span className="text-muted-foreground">Zepto pricier</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {categoryPricePressure.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
              ) : (
                <ResponsiveContainer width="100%" height={categoryPricePressure.length * 52 + 40}>
                  <BarChart
                    data={categoryPricePressure}
                    layout="vertical"
                    margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={160}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                    <RechartsTooltip
                      cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-lg space-y-1.5">
                            <div className="font-semibold text-foreground">{d.category}</div>
                            <div className="text-muted-foreground">
                              Zepto avg: <span className="font-medium text-foreground">₹{d.zepto_avg_price.toFixed(2)}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Competitor avg: <span className="font-medium text-foreground">₹{d.competitor_avg_price.toFixed(2)}</span>
                            </div>
                            <div className={`font-semibold ${d.price_gap_pct >= 0 ? "text-status-low" : "text-status-high"}`}>
                              Gap: {d.price_gap_pct > 0 ? "+" : ""}{d.price_gap_pct}%
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="price_gap_pct" radius={[0, 4, 4, 0]} maxBarSize={24}>
                      {categoryPricePressure.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={entry.price_gap_pct >= 0
                            ? "hsl(var(--status-low))"
                            : "hsl(var(--status-high))"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Platform Competitiveness Summary + Category Rollup */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Competitive Comparison</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle>Platform Competitiveness Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformScores.map((p) => (
                    <div key={p.platform} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{p.platform}</span>
                        <span className="text-muted-foreground font-mono">{p.score}/100</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${scoreColor(p.score)}`}
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span>Price {p.priceComp.toFixed(0)}%</span>
                        <span>Avail {p.avail.toFixed(0)}%</span>
                        <span>Search {p.search.toFixed(0)}%</span>
                        <span>Assort {p.assort.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <CategoryLevelRollup priceData={priceData} availData={availData} />
          </div>
        </section>

        {/* Top Price Gap Items */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Price Gap Items</h2>
          <Card className="bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Price Gap Items</CardTitle>
                <Button variant="outline" size="sm">
                  View All
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topPriceGapSKUs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No price gap data for selected filters.</p>
              ) : (
                <div className="space-y-3">
                  {topPriceGapSKUs.map((item, index) => {
                    const risk = getRiskLevel(item.gapPct);
                    return (
                      <div
                        key={`${item.sku_id}-${item.platform}`}
                        className={cn(
                          "p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                          getRiskColor(risk)
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                            <span className="font-medium text-sm">{item.product_name}</span>
                          </div>
                          <Badge variant={getRiskBadgeVariant(risk)} className="text-xs">
                            {risk}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-muted-foreground">SKU</div>
                            <div className="font-mono">{item.sku_id}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Category</div>
                            <div>{item.category}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Avg Price ({item.platform})</div>
                            <div className="font-medium">₹{item.platformPrice.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Cross-platform Avg</div>
                            <div className="font-medium">₹{item.competitorAvg.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Price Gap: </span>
                            <span className="font-medium text-status-high">+{item.gapPct.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Platform: </span>
                            <span className="font-medium">{item.platform}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </TooltipProvider>
  );
};

export default CompetitiveOverview;
