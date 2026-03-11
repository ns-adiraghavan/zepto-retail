import { KPICard } from "@/components/dashboard/KPICard";
import { PriceHeatmap } from "@/components/dashboard/PriceHeatmap";
import { CategoryLevelRollup } from "@/components/dashboard/CategoryLevelRollup";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import {
  availabilityKPIs,
  platformHeatmapData,
  platformAlertsData,
  platforms,
  categories,
} from "@/data/platformData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stockoutRows = [
  { sku: "DRY-MLK-AML", name: "Amul Full Cream Milk 1L", platform: "Zepto", city: "Delhi NCR", duration: "4h 12m", severity: "High" as const },
  { sku: "FRV-TOM-KG", name: "Tomatoes 1 kg", platform: "Blinkit", city: "Pune", duration: "1h 45m", severity: "Medium" as const },
  { sku: "SNK-LAY-CLR-40", name: "Lays Classic 40g", platform: "Swiggy Instamart", city: "Hyderabad", duration: "35m", severity: "Low" as const },
  { sku: "GRC-TTM-SFW-1KG", name: "Tata Salt 1 kg", platform: "BigBasket Now", city: "Mumbai", duration: "2h 05m", severity: "High" as const },
  { sku: "HPC-HHD-500", name: "Head & Shoulders 500ml", platform: "Zepto", city: "Bangalore", duration: "55m", severity: "Medium" as const },
];

const AvailabilityIntelligence = () => {
  const severityVariant = (s: "High" | "Medium" | "Low") =>
    s === "High" ? "destructive" : s === "Medium" ? "secondary" : "outline";

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Availability Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Track stockouts, fill rates, and inventory gaps across platforms and cities
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availabilityKPIs.map((kpi, i) => (
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
              <CardTitle>Platform Availability Rates</CardTitle>
              <CardDescription>% of tracked SKUs currently in stock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Zepto", rate: 97.1 },
                  { name: "Blinkit", rate: 94.8 },
                  { name: "Swiggy Instamart", rate: 91.3 },
                  { name: "BigBasket Now", rate: 96.2 },
                ].map((p) => (
                  <div key={p.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground">{p.rate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.rate >= 95 ? "bg-status-low" : p.rate >= 92 ? "bg-status-medium" : "bg-status-high"}`}
                        style={{ width: `${p.rate}%` }}
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
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Active Stockout Events</CardTitle>
            <CardDescription>Current stockouts by platform, city, and duration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Product</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Platform</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">City</th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Duration</th>
                    <th className="py-2 font-medium text-muted-foreground">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {stockoutRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{row.sku}</div>
                      </td>
                      <td className="py-2 pr-4">{row.platform}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{row.city}</td>
                      <td className="py-2 pr-4 font-medium">{row.duration}</td>
                      <td className="py-2">
                        <Badge variant={severityVariant(row.severity)} className="text-xs">{row.severity}</Badge>
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

export default AvailabilityIntelligence;
