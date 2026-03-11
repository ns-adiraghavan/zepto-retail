import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { TopRiskSKUs } from "@/components/dashboard/TopRiskSKUs";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  competitiveOverviewKPIs,
  platformHeatmapData,
  platformAlertsData,
  topPriceGapItems,
} from "@/data/platformData";
import { getPlatformSummary } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

const CompetitiveOverview = () => {
  return (
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
          {competitiveOverviewKPIs.map((kpi, i) => (
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
              <CardTitle>Platform Competitiveness Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Zepto", score: 88, color: "bg-status-low" },
                  { name: "Blinkit", score: 74, color: "bg-status-medium" },
                  { name: "Swiggy Instamart", score: 65, color: "bg-status-high" },
                  { name: "BigBasket Now", score: 81, color: "bg-status-low" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="w-32 text-sm font-medium">{p.name}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.color}`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-sm text-muted-foreground">{p.score}</div>
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
          <div className="bg-card p-4 lg:p-6 rounded-lg border border-border">
            <QuickActions />
          </div>
        </div>
      </section>
    </div>
  );
};

export default CompetitiveOverview;
