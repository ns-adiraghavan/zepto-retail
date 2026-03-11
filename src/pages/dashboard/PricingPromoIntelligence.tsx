import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { platformHeatmapData } from "@/data/platformData";
import { getDiscountByPlatform, getPriceData } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutletContext } from "react-router-dom";

interface DashboardContext {
  selectedCity: string;
  selectedPlatform: string;
}

const promoRows = [
  { platform: "Blinkit", category: "Snacks & Beverages", type: "Flash Sale", discount: "40%", city: "Bangalore", status: "Active" as const },
  { platform: "Zepto", category: "Dairy & Eggs", type: "Combo Offer", discount: "15%", city: "Mumbai", status: "Active" as const },
  { platform: "Swiggy Instamart", category: "Personal Care", type: "Buy 2 Get 1", discount: "33%", city: "Delhi NCR", status: "Active" as const },
  { platform: "BigBasket Now", category: "Staples & Grains", type: "Weekend Deal", discount: "10%", city: "All", status: "Active" as const },
  { platform: "Zepto", category: "Fruits & Vegetables", type: "Loyalty Discount", discount: "12%", city: "Hyderabad", status: "Ending Soon" as const },
];

const PricingPromoIntelligence = () => {
  const { selectedCity, selectedPlatform } = useOutletContext<DashboardContext>();

  const priceData = getPriceData(selectedCity, selectedPlatform);
  const discountByPlatform = getDiscountByPlatform(selectedCity, selectedPlatform);

  const avgDiscount =
    priceData.length > 0
      ? priceData.reduce((s, r) => s + r.discount_percent, 0) / priceData.length
      : 0;

  const promoCount = priceData.filter((r) => r.promotion_flag === 1).length;
  const promoRate = priceData.length > 0 ? (promoCount / priceData.length) * 100 : 0;

  const kpis = [
    {
      title: "Average Discount",
      value: `${avgDiscount.toFixed(1)}%`,
      change: avgDiscount,
      changeType: "percentage" as const,
      trend: "neutral" as const,
      tooltip: "Mean discount % across all price observations",
    },
    {
      title: "Promotion Intensity",
      value: `${promoRate.toFixed(1)}%`,
      change: promoRate,
      changeType: "percentage" as const,
      trend: promoRate > 30 ? ("up" as const) : ("neutral" as const),
      tooltip: "Share of observations with an active promotion flag",
    },
    {
      title: "SKUs Under Promotion",
      value: promoCount.toLocaleString(),
      trend: "neutral" as const,
      tooltip: "Number of price observations with promotion_flag = 1",
    },
    {
      title: "Price Observations",
      value: priceData.length.toLocaleString(),
      trend: "neutral" as const,
      tooltip: "Total rows in the filtered price tracking dataset",
    },
  ];

  const barColor = (discount: number) =>
    discount >= 20 ? "bg-status-high" : discount >= 10 ? "bg-status-medium" : "bg-status-low";

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
          {kpis.map((kpi, i) => (
            <KPICard key={i} {...kpi} />
          ))}
        </div>
      </section>

      {/* Category Price Competitiveness Heatmap */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Price Competitiveness</h2>
        <PriceHeatmap data={platformHeatmapData} />
      </section>

      {/* Platform Discount Comparison + Active Promotions */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Discount Comparison</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Platform Average Discount</CardTitle>
              <CardDescription>Mean discount % per platform from price tracking data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discountByPlatform.map((p) => (
                  <div key={p.platform} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{p.platform}</span>
                      <span className="text-muted-foreground">{p.avgDiscount}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(p.avgDiscount)}`}
                        style={{ width: `${Math.min(p.avgDiscount * 2.5, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
