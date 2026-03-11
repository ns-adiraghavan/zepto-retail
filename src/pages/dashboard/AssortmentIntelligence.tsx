import { KPICard } from "@/components/dashboard/KPICard";
import { getAssortmentData, getListingCountByPlatform } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutletContext } from "react-router-dom";

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
      tooltip: "Total SKUs currently listed",
    },
    {
      title: "Missing SKUs",
      value: missingCount.toLocaleString(),
      trend: "down" as const,
      tooltip: "SKUs not carried by the platform",
    },
    {
      title: "Categories Covered",
      value: categoryCount.toLocaleString(),
      trend: "neutral" as const,
      tooltip: "Distinct product categories tracked",
    },
  ];

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
