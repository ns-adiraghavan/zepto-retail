import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { TopRiskSKUs } from "@/components/dashboard/TopRiskSKUs";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import {
  pricingKPIs,
  platformHeatmapData,
  platformAlertsData,
  topPriceGapItems,
} from "@/data/platformData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const promoRows = [
  { platform: "Blinkit", category: "Snacks & Beverages", type: "Flash Sale", discount: "40%", city: "Bangalore", status: "Active" as const },
  { platform: "Zepto", category: "Dairy & Eggs", type: "Combo Offer", discount: "15%", city: "Mumbai", status: "Active" as const },
  { platform: "Swiggy Instamart", category: "Personal Care", type: "Buy 2 Get 1", discount: "33%", city: "Delhi NCR", status: "Active" as const },
  { platform: "BigBasket Now", category: "Staples & Grains", type: "Weekend Deal", discount: "10%", city: "All", status: "Active" as const },
  { platform: "Zepto", category: "Fruits & Vegetables", type: "Loyalty Discount", discount: "12%", city: "Hyderabad", status: "Ending Soon" as const },
];

const PricingPromoIntelligence = () => {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <Tag className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Pricing & Promotion Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Monitor price movements, discounts, and promotional strategies across platforms
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingKPIs.map((kpi, i) => (
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
            <AlertsPanel alerts={platformAlertsData.filter((a) => a.type === "competitor")} />
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
              <CardTitle>Platform Avg Price Index</CardTitle>
              <CardDescription>Index relative to category median (100 = parity)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Zepto", index: 97.4, diff: -2.6 },
                  { name: "Blinkit", index: 102.3, diff: +2.3 },
                  { name: "Swiggy Instamart", index: 99.1, diff: -0.9 },
                  { name: "BigBasket Now", index: 95.8, diff: -4.2 },
                ].map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <span className="w-36 font-medium">{p.name}</span>
                    <span className="font-bold">{p.index}</span>
                    <span className={p.diff < 0 ? "text-status-low" : "text-status-high"}>
                      {p.diff > 0 ? "+" : ""}{p.diff}%
                    </span>
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
              <CardTitle>Active Promotions Tracker</CardTitle>
              <CardDescription>Current promotional campaigns across platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Platform</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Category</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Type</th>
                      <th className="py-2 pr-3 font-medium text-muted-foreground">Disc.</th>
                      <th className="py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoRows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-3 font-medium">{row.platform}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{row.category}</td>
                        <td className="py-2 pr-3">{row.type}</td>
                        <td className="py-2 pr-3 font-semibold text-status-high">{row.discount}</td>
                        <td className="py-2">
                          <Badge variant={row.status === "Active" ? "default" : "secondary"} className="text-xs">
                            {row.status}
                          </Badge>
                        </td>
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

export default PricingPromoIntelligence;
