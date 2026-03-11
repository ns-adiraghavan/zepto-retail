import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { TopRiskSKUs } from "@/components/dashboard/TopRiskSKUs";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import {
  assortmentKPIs,
  platformHeatmapData,
  platformAlertsData,
  topPriceGapItems,
  platforms,
  categories,
} from "@/data/platformData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const exclusiveItems = [
  { platform: "BigBasket Now", sku: "BB-PVTLBL-RICE-5KG", name: "BB Organics Basmati Rice 5kg", category: "Staples & Grains" },
  { platform: "Zepto", sku: "ZP-CAFE-BRW-250", name: "Zepto Cafe Cold Brew 250ml", category: "Snacks & Beverages" },
  { platform: "Blinkit", sku: "BL-KITCHEN-SET", name: "Blinkit Quick Kitchen Set", category: "Household Essentials" },
  { platform: "Swiggy Instamart", sku: "SI-COMBO-BF", name: "Instamart Breakfast Combo", category: "Dairy & Eggs" },
];

const AssortmentIntelligence = () => {
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
          {assortmentKPIs.map((kpi, i) => (
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
            <AlertsPanel alerts={platformAlertsData.filter((a) => a.type === "inventory")} />
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
              <CardTitle>SKU Count by Platform × Category</CardTitle>
              <CardDescription>Approximate listed SKUs per category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Category</th>
                      {platforms.map((p) => (
                        <th key={p} className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">
                          {p.split(" ")[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.slice(0, 5).map((cat) => (
                      <tr key={cat} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-3 font-medium">{cat}</td>
                        {platforms.map((p) => {
                          const count = Math.floor(Math.random() * 300) + 80;
                          return (
                            <td key={p} className="py-2 px-2 text-center text-muted-foreground">
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
