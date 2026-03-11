import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import {
  searchKPIs,
  platformHeatmapData,
  platformAlertsData,
  platforms,
  categories,
} from "@/data/platformData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const shelfRows = [
  { keyword: "milk 1 litre", platform: "Zepto", rank: 1, sponsored: false, brand: "Amul" },
  { keyword: "milk 1 litre", platform: "Blinkit", rank: 3, sponsored: true, brand: "Mother Dairy" },
  { keyword: "tomatoes 500g", platform: "Swiggy Instamart", rank: 2, sponsored: false, brand: "Fresh Daily" },
  { keyword: "lays classic", platform: "BigBasket Now", rank: 5, sponsored: true, brand: "PepsiCo" },
  { keyword: "head shoulders", platform: "Zepto", rank: 4, sponsored: false, brand: "P&G" },
  { keyword: "tata salt 1kg", platform: "Blinkit", rank: 1, sponsored: false, brand: "Tata" },
];

const SearchShelfVisibility = () => {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <Search className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Search & Digital Shelf Visibility</h1>
          <p className="text-sm text-muted-foreground">
            Track search rankings, sponsored placements, and brand visibility across platforms
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {searchKPIs.map((kpi, i) => (
            <KPICard key={i} {...kpi} />
          ))}
        </div>
      </section>

      {/* Trend Analysis */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Trend Analysis</h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <PriceHeatmap data={platformHeatmapData} />
          </div>
          <div className="xl:col-span-1">
            <AlertsPanel alerts={platformAlertsData.slice(0, 3)} />
          </div>
        </div>
      </section>

      {/* Competitive Comparison */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Competitive Comparison</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryLevelRollup />
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Sponsored vs Organic Share</CardTitle>
              <CardDescription>Top-10 search results composition by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platforms.map((p) => {
                  const sponsored = Math.floor(Math.random() * 30) + 25;
                  return (
                    <div key={p} className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{p}</span>
                        <span>{sponsored}% sponsored</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                        <div className="bg-status-high h-full" style={{ width: `${sponsored}%` }} />
                        <div className="bg-status-low h-full flex-1" />
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-status-high" />Sponsored</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-status-low" />Organic</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detailed Insights */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Detailed Insights</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Keyword Shelf Position Tracker</CardTitle>
            <CardDescription>Search rank for top keywords across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Keyword</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Platform</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Rank</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Brand</th>
                    <th className="py-2 font-medium text-muted-foreground">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {shelfRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{row.keyword}</td>
                      <td className="py-2 pr-4">{row.platform}</td>
                      <td className="py-2 pr-4 font-bold">#{row.rank}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{row.brand}</td>
                      <td className="py-2">
                        <Badge variant={row.sponsored ? "destructive" : "outline"} className="text-xs">
                          {row.sponsored ? "Sponsored" : "Organic"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default SearchShelfVisibility;
