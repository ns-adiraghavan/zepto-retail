import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { TopRiskSKUs } from "@/components/dashboard/TopRiskSKUs";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { platformHeatmapData, platformAlertsData, topPriceGapItems } from "@/data/platformData";
import {
  getAvailabilityByPlatform,
  getDiscountByPlatform,
  getSponsoredShareByPlatform,
  getListingCountByPlatform,
} from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useMemo } from "react";

const CITIES = ["Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];

function avg(arr: number[]) {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

const LocalMarketIntelligence = () => {
  const cityScores = useMemo(() =>
    CITIES.map((city) => {
      const availPlatforms = getAvailabilityByPlatform(city);
      const discountPlatforms = getDiscountByPlatform(city);
      const searchPlatforms = getSponsoredShareByPlatform(city);
      const listingPlatforms = getListingCountByPlatform(city);

      const availability = avg(availPlatforms.map((p) => p.rate));
      const discount = avg(discountPlatforms.map((p) => p.avgDiscount));
      const search = avg(searchPlatforms.map((p) => p.sponsoredShare));
      const assortment = listingPlatforms.reduce((s, p) => s + p.listed, 0);
      const score = Math.round((availability + search + (100 - discount)) / 3);

      return { city, availability, discount, search, assortment, score };
    }),
  []);

  const sortedByScore = [...cityScores].sort((a, b) => b.score - a.score);
  const bestCity = sortedByScore[0];
  const worstCity = sortedByScore[sortedByScore.length - 1];
  const avgScore = avg(cityScores.map((c) => c.score));

  const kpis = [
    {
      title: "Avg City Score",
      value: avgScore.toFixed(1),
      trend: "neutral" as const,
      tooltip: "Composite score averaged across all five cities",
    },
    {
      title: "Best Performing City",
      value: bestCity?.city ?? "—",
      change: bestCity?.score,
      changeType: "absolute" as const,
      trend: "up" as const,
      tooltip: "City with the highest composite intelligence score",
    },
    {
      title: "Lowest Performing City",
      value: worstCity?.city ?? "—",
      change: worstCity?.score,
      changeType: "absolute" as const,
      trend: "down" as const,
      tooltip: "City with the lowest composite intelligence score",
    },
    {
      title: "Cities Tracked",
      value: CITIES.length.toString(),
      trend: "neutral" as const,
      tooltip: "Number of cities included in this intelligence module",
    },
  ];

  const barColor = (score: number) =>
    score >= 80 ? "bg-status-low" : score >= 70 ? "bg-status-medium" : "bg-status-high";

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
          {kpis.map((kpi, i) => (
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
              <CardDescription>Composite score: availability + search visibility − discount intensity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cityScores.map((c) => (
                  <div key={c.city} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{c.city}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Avail {c.availability.toFixed(0)}%</span>
                        <span>Disc {c.discount.toFixed(1)}%</span>
                        <span className="font-semibold text-foreground">{c.score}/100</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(c.score)}`}
                        style={{ width: `${c.score}%` }}
                      />
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
