import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { TopRiskSKUs } from "@/components/dashboard/TopRiskSKUs";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  platformHeatmapData,
  platformAlertsData,
  topPriceGapItems,
} from "@/data/platformData";
import { getPlatformSummary } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "bg-status-low";
  if (score >= 60) return "bg-status-medium";
  return "bg-status-high";
};

const CompetitiveOverview = () => {
  const platformScores = getPlatformSummary();

  // Derive KPIs from real data
  const avgCompetitiveness = Math.round(
    platformScores.reduce((s, p) => s + p.competitiveness_score, 0) / platformScores.length
  );

  const avgPriceGap =
    platformScores.reduce((s, p) => s + (p.price_index - 100), 0) / platformScores.length;

  const availRates = platformScores.map((p) => p.availability_rate);
  const availabilityGap = Math.max(...availRates) - Math.min(...availRates);

  const searchLeader = [...platformScores].sort(
    (a, b) => b.search_visibility - a.search_visibility
  )[0];

  const liveKPIs = [
    {
      title: "Competitive Score",
      value: `${avgCompetitiveness}/100`,
      change: 0,
      trend: "neutral" as const,
      status: avgCompetitiveness >= 70 ? ("low" as const) : ("medium" as const),
      tooltip: "Weighted composite competitiveness score across all platforms.",
    },
    {
      title: "Price Gap vs Market",
      value: `${avgPriceGap.toFixed(1)}%`,
      change: 0,
      trend: avgPriceGap > 0 ? ("down" as const) : ("up" as const),
      status: avgPriceGap > 0 ? ("medium" as const) : ("low" as const),
      tooltip: "Average deviation of platform price index from market parity (100).",
    },
    {
      title: "Availability Gap",
      value: `${availabilityGap.toFixed(1)}pp`,
      change: 0,
      trend: availabilityGap > 5 ? ("down" as const) : ("neutral" as const),
      status: availabilityGap > 5 ? ("medium" as const) : ("low" as const),
      tooltip: "Percentage-point spread between best and worst availability rates across platforms.",
    },
    {
      title: "Search Visibility Leader",
      value: searchLeader.platform,
      change: searchLeader.search_visibility,
      trend: "up" as const,
      status: "low" as const,
      tooltip: "Platform with the highest sponsored search visibility share.",
    },
  ];

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
          {liveKPIs.map((kpi, i) => (
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
                {platformScores.map((p) => (
                  <div key={p.platform} className="flex items-center gap-3">
                    <div className="w-36 text-sm font-medium truncate">{p.platform}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${SCORE_COLOR(p.competitiveness_score)}`}
                        style={{ width: `${p.competitiveness_score}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-sm text-muted-foreground">
                      {p.competitiveness_score}
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
          <div className="bg-card p-4 lg:p-6 rounded-lg border border-border">
            <QuickActions />
          </div>
        </div>
      </section>
    </div>
  );
};

export default CompetitiveOverview;
