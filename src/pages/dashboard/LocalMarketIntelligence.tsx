import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { TopRiskSKUs } from "@/components/dashboard/TopRiskSKUs";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import {
  localMarketKPIs,
  platformHeatmapData,
  platformAlertsData,
  topPriceGapItems,
  cities,
  platforms,
} from "@/data/platformData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const cityScores = [
  { city: "Bangalore", score: 82, leader: "Zepto", insight: "Highest promo density" },
  { city: "Mumbai", score: 76, leader: "Blinkit", insight: "Fastest delivery SLA" },
  { city: "Delhi NCR", score: 71, leader: "Swiggy Instamart", insight: "Most stockout events" },
  { city: "Pune", score: 68, leader: "BigBasket Now", insight: "Lowest price variance" },
  { city: "Hyderabad", score: 74, leader: "Zepto", insight: "Growing platform share" },
];

const LocalMarketIntelligence = () => {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
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

      {/* KPI Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {localMarketKPIs.map((kpi, i) => (
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
            <AlertsPanel alerts={platformAlertsData} />
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
              <CardTitle>City Intelligence Scores</CardTitle>
              <CardDescription>Composite market intelligence score per city</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cityScores.map((c) => (
                  <div key={c.city} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{c.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{c.insight}</span>
                        <Badge variant="outline" className="text-xs">{c.score}/100</Badge>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.score >= 80 ? "bg-status-low" : c.score >= 70 ? "bg-status-medium" : "bg-status-high"}`}
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Market leader: <span className="font-medium text-foreground">{c.leader}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detailed Insights */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Detailed Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopRiskSKUs skus={topPriceGapItems} />
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Hyper-local Promotions</CardTitle>
              <CardDescription>City-specific offers not available nationally</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-3 font-medium text-muted-foreground">City</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Platform</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Category</th>
                      <th className="py-2 font-medium text-muted-foreground">Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { city: "Bangalore", platform: "Zepto", category: "Fruits & Vegetables", discount: "20%" },
                      { city: "Mumbai", platform: "Blinkit", category: "Dairy & Eggs", discount: "15%" },
                      { city: "Delhi NCR", platform: "Swiggy Instamart", category: "Snacks & Beverages", discount: "25%" },
                      { city: "Pune", platform: "BigBasket Now", category: "Staples & Grains", discount: "10%" },
                      { city: "Hyderabad", platform: "Zepto", category: "Personal Care", discount: "18%" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-3 font-medium">{row.city}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{row.platform}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{row.category}</td>
                        <td className="py-2 font-semibold text-status-high">{row.discount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LocalMarketIntelligence;
