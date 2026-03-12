import { KPICard } from "@/components/dashboard/KPICard";
import { getAssortmentData, getListingCountByPlatform, datasets } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutletContext } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StrategicInsightsPanel, type Insight } from "@/components/dashboard/StrategicInsightsPanel";

interface DashboardContext {
  selectedCity: string;
  selectedPlatform: string;
}

const exclusiveItems = [
  { platform: "BigBasket Now", sku: "BB-PVTLBL-RICE-5KG", name: "BB Organics Basmati Rice 5kg", category: "Staples & Grains" },
  { platform: "Zepto", sku: "ZP-CAFE-BRW-250", name: "Zepto Cafe Cold Brew 250ml", category: "Snacks & Beverages" },
  { platform: "Blinkit", sku: "BL-KITCHEN-SET", name: "Blinkit Quick Kitchen Set", category: "Household Essentials" },
  { platform: "Swiggy Instamart", sku: "SI-COMBO-BF", name: "Instamart Breakfast Combo", category: "Dairy & Eggs" },
];

const AssortmentIntelligence = () => {
  const { selectedCity, selectedPlatform } = useOutletContext<DashboardContext>();

  const assortmentData = getAssortmentData(selectedCity, selectedPlatform);
  const listingByPlatform = getListingCountByPlatform(selectedCity, selectedPlatform);

  const listedCount = assortmentData.filter((r) => r.listing_status === 1).length;
  const missingCount = assortmentData.filter((r) => r.listing_status === 0).length;
  const coverageRate =
    assortmentData.length > 0 ? (listedCount / assortmentData.length) * 100 : 0;
  const categoryCount = new Set(assortmentData.map((r) => r.category)).size;

  const kpis = [
    {
      title: "SKU Coverage",
      value: `${coverageRate.toFixed(1)}%`,
      change: coverageRate,
      changeType: "percentage" as const,
      trend: coverageRate > 80 ? ("up" as const) : ("neutral" as const),
      tooltip: "Share of SKUs listed across tracked platforms",
    },
    {
      title: "Listed SKUs",
      value: listedCount.toLocaleString(),
      trend: "neutral" as const,
      tooltip: "Number of SKUs currently listed on the platform. Counts all observations where listing_status = 1.",
    },
    {
      title: "Missing SKUs",
      value: missingCount.toLocaleString(),
      trend: "down" as const,
      tooltip: "Number of SKUs present on competitors but missing from the selected platform. Indicates assortment gaps.",
    },
    {
      title: "Categories Covered",
      value: categoryCount.toLocaleString(),
      trend: "neutral" as const,
      tooltip: "Distinct product categories tracked",
    },
  ];

  // ── Category SKU Coverage Grid ─────────────────────────────────────────────
  const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

  const coverageRaw: Record<string, Record<string, number>> = {};
  assortmentData.forEach((row) => {
    if (row.listing_status !== 1) return;
    if (!coverageRaw[row.category]) coverageRaw[row.category] = {};
    coverageRaw[row.category][row.platform] = (coverageRaw[row.category][row.platform] ?? 0) + 1;
  });

  // ── Category Assortment Coverage (Grouped Bar Chart) ──────────────────────
  const PLATFORMS_ALL = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];
  const PLATFORM_COLORS: Record<string, string> = {
    "Zepto": "hsl(var(--chart-1))",
    "Blinkit": "hsl(var(--chart-2))",
    "Swiggy Instamart": "hsl(var(--chart-3))",
    "BigBasket Now": "hsl(var(--chart-4))",
  };

  // Build platform+category SKU counts from full dataset (not city/platform filtered)
  const categoryPlatformRaw: Record<string, Record<string, Set<string>>> = {};
  datasets.assortmentTracking
    .filter((r) => r.listing_status === 1)
    .forEach((r) => {
      if (!categoryPlatformRaw[r.category]) categoryPlatformRaw[r.category] = {};
      if (!categoryPlatformRaw[r.category][r.platform]) categoryPlatformRaw[r.category][r.platform] = new Set();
      categoryPlatformRaw[r.category][r.platform].add(r.sku_id);
    });

  // Convert to chart-friendly rows, compute total for sorting
  const categoryPlatformRows = Object.entries(categoryPlatformRaw)
    .map(([category, platformMap]) => {
      const row: Record<string, string | number> = { category };
      let total = 0;
      PLATFORMS_ALL.forEach((p) => {
        const cnt = platformMap[p]?.size ?? 0;
        row[p] = cnt;
        total += cnt;
      });
      row._total = total;
      return row;
    })
    .sort((a, b) => (b._total as number) - (a._total as number))
    .slice(0, 8)
    .map(({ _total, ...rest }) => rest);

  const coverageGrid = Object.entries(coverageRaw)
    .map(([category, platforms]) => ({ category, ...platforms }))
    .sort((a, b) => a.category.localeCompare(b.category));

  // Determine max count for relative cell intensity
  const maxCount = Math.max(
    1,
    ...coverageGrid.flatMap((row) =>
      PLATFORMS.map((p) => (row as Record<string, number | string>)[p] as number ?? 0)
    )
  );

  const getCellIntensity = (count: number) => {
    if (!count) return "bg-muted/20 text-muted-foreground/40 border-border/20";
    const pct = count / maxCount;
    if (pct >= 0.66) return "bg-status-low/20 text-status-low border-status-low/30";
    if (pct >= 0.33) return "bg-status-medium/20 text-status-medium border-status-medium/30";
    return "bg-status-high/10 text-status-high border-status-high/20";
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Assortment & Product Mix Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Analyse SKU breadth, exclusive listings, and product mix gaps across platforms
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <KPICard key={i} {...kpi} />
          ))}
        </div>
      </section>

      {/* Strategic Insights */}
      {(() => {
        // Insight 1 — SKU Coverage Leader: platform with most listed SKUs
        const platformListTotals = listingByPlatform.map((p) => ({ platform: p.platform, total: p.listed }))
          .sort((a, b) => b.total - a.total);
        const skuLeader = platformListTotals[0];

        // Insight 2 — Category Assortment Gap: category where Zepto has fewest SKUs vs competitor avg
        const catZeptoRaw: Record<string, number> = {};
        const catCompRaw: Record<string, { sum: number; count: number }> = {};
        assortmentData.filter((r) => r.listing_status === 1).forEach((r) => {
          if (r.platform === "Zepto") {
            catZeptoRaw[r.category] = (catZeptoRaw[r.category] ?? 0) + 1;
          } else {
            if (!catCompRaw[r.category]) catCompRaw[r.category] = { sum: 0, count: 0 };
            catCompRaw[r.category].sum += 1;
            catCompRaw[r.category].count++;
          }
        });
        const catGapItems = Object.keys(catZeptoRaw)
          .filter((cat) => catCompRaw[cat])
          .map((cat) => ({
            cat,
            zepto: catZeptoRaw[cat],
            compAvg: catCompRaw[cat].sum / 3, // 3 other platforms
            gap: catCompRaw[cat].sum / 3 - catZeptoRaw[cat],
          }))
          .sort((a, b) => b.gap - a.gap);
        const worstCatGap = catGapItems[0];

        // Insight 3 — Assortment Depth: category with highest total SKU listings
        const catTotals = Object.entries(coverageRaw)
          .map(([category, platMap]) => ({
            category,
            total: Object.values(platMap).reduce((s, v) => s + v, 0),
          }))
          .sort((a, b) => b.total - a.total);
        const deepestCat = catTotals[0];

        const insights: Insight[] = [
          skuLeader
            ? {
                icon: "package",
                title: "SKU Coverage Leader",
                body: `${skuLeader.platform} has the broadest assortment with ${skuLeader.total.toLocaleString()} listed SKUs — the strongest product depth across all tracked platforms.`,
                type: "positive",
              }
            : { icon: "package", title: "SKU Coverage Leader", body: "No listing data available.", type: "neutral" },
          worstCatGap
            ? {
                icon: "trend-down",
                title: "Category Assortment Gap",
                body: `Zepto carries ${worstCatGap.zepto} SKUs in ${worstCatGap.cat} versus a competitor average of ${worstCatGap.compAvg.toFixed(0)} — the widest assortment gap.`,
                type: "warning",
              }
            : { icon: "trend-down", title: "Category Assortment Gap", body: "No gap data available.", type: "neutral" },
          deepestCat
            ? {
                icon: "chart",
                title: "Assortment Depth",
                body: `${deepestCat.category} has the highest total SKU listings across platforms (${deepestCat.total.toLocaleString()} listings), reflecting the deepest product selection.`,
                type: "positive",
              }
            : { icon: "chart", title: "Assortment Depth", body: "No depth data available.", type: "neutral" },
        ];
        return <StrategicInsightsPanel insights={insights} />;
      })()}

      {/* Category Assortment Coverage – Grouped Bar Chart */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Assortment Coverage</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Category Assortment Coverage</CardTitle>
            <CardDescription>
              Distinct listed SKUs per category by platform — top 8 categories by total SKU count
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryPlatformRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryPlatformRows} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: "Listed SKUs", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                  />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name: string) => [`${value} SKUs`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  {PLATFORMS_ALL.map((platform) => (
                    <Bar key={platform} dataKey={platform} fill={PLATFORM_COLORS[platform]} radius={[3, 3, 0, 0]} maxBarSize={20} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Category Assortment Depth Grid */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Assortment Depth</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Category Assortment Depth</CardTitle>
                <CardDescription>Listed SKU count by category and platform</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-status-low/30 border border-status-low/30 inline-block" />
                  High coverage
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-status-medium/30 border border-status-medium/30 inline-block" />
                  Moderate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-status-high/10 border border-status-high/20 inline-block" />
                  Low coverage
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {coverageGrid.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No listed SKUs for selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[160px]">Category</th>
                      {PLATFORMS.map((p) => (
                        <th key={p} className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[120px]">{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coverageGrid.map((row) => (
                      <tr key={row.category} className="border-b border-border/40">
                        <td className="py-2 px-3 font-medium">{row.category}</td>
                        {PLATFORMS.map((platform) => {
                          const count = (row as Record<string, number | string>)[platform] as number ?? 0;
                          return (
                            <td key={platform} className="p-2 text-center">
                              <div className={`rounded-md px-2 py-2 text-xs font-semibold border transition-all hover:scale-105 cursor-default ${getCellIntensity(count)}`}>
                                {count > 0 ? count : "—"}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Listed vs Missing SKUs by Platform + Platform Exclusives */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Assortment Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Listed vs Missing SKUs by Platform</CardTitle>
              <CardDescription>Share of tracked SKUs currently listed per platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {listingByPlatform.map((p) => {
                  const total = p.listed + p.notListed;
                  const listedPct = total > 0 ? (p.listed / total) * 100 : 0;
                  return (
                    <div key={p.platform} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{p.platform}</span>
                        <span className="text-muted-foreground">
                          {p.listed.toLocaleString()} listed · {p.notListed.toLocaleString()} missing
                        </span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                        <div
                          className="bg-status-low h-full"
                          style={{ width: `${listedPct}%` }}
                        />
                        <div className="bg-status-high h-full flex-1" />
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-status-low" />Listed</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-status-high" />Missing</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Platform-Exclusive SKUs</CardTitle>
              <CardDescription>Products listed on only one platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exclusiveItems.map((item) => (
                  <div key={item.sku} className="flex items-start justify-between p-3 rounded-lg border border-border bg-background/50">
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.category}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2 shrink-0">{item.platform}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AssortmentIntelligence;
