import { KPICard } from "@/components/dashboard/KPICard";
import { getAvailabilityByPlatform, getAvailabilityData } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutletContext } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const stockoutRows = [
  { sku: "DRY-MLK-AML", name: "Amul Full Cream Milk 1L", platform: "Zepto", city: "Delhi NCR", duration: "4h 12m", severity: "High" as const },
  { sku: "FRV-TOM-KG", name: "Tomatoes 1 kg", platform: "Blinkit", city: "Pune", duration: "1h 45m", severity: "Medium" as const },
  { sku: "SNK-LAY-CLR-40", name: "Lays Classic 40g", platform: "Swiggy Instamart", city: "Hyderabad", duration: "35m", severity: "Low" as const },
  { sku: "GRC-TTM-SFW-1KG", name: "Tata Salt 1 kg", platform: "BigBasket Now", city: "Mumbai", duration: "2h 05m", severity: "High" as const },
  { sku: "HPC-HHD-500", name: "Head & Shoulders 500ml", platform: "Zepto", city: "Bangalore", duration: "55m", severity: "Medium" as const },
];

interface DashboardContext {
  selectedCity: string;
  selectedPlatform: string;
}

const AvailabilityIntelligence = () => {
  const { selectedCity } = useOutletContext<DashboardContext>();

  const availabilityByPlatform = getAvailabilityByPlatform(selectedCity);

  const sorted = [...availabilityByPlatform].sort((a, b) => a.rate - b.rate);
  const avgAvailability =
    availabilityByPlatform.length > 0
      ? availabilityByPlatform.reduce((s, p) => s + p.rate, 0) / availabilityByPlatform.length
      : 0;
  const lowestPlatform = sorted[0];
  const highestPlatform = sorted[sorted.length - 1];
  const availabilityGap =
    highestPlatform && lowestPlatform ? highestPlatform.rate - lowestPlatform.rate : 0;

  const kpis = [
    {
      title: "Avg Availability Rate",
      value: `${avgAvailability.toFixed(1)}%`,
      change: 0.4,
      trend: "up" as const,
      tooltip: "Across all tracked platforms",
    },
    {
      title: "Best Platform",
      value: highestPlatform ? highestPlatform.platform : "—",
      change: highestPlatform ? highestPlatform.rate : undefined,
      trend: "up" as const,
      tooltip: "Highest availability rate",
    },
    {
      title: "Lowest Platform",
      value: lowestPlatform ? lowestPlatform.platform : "—",
      change: lowestPlatform ? lowestPlatform.rate : undefined,
      trend: "down" as const,
      tooltip: "Most stockout risk",
    },
    {
      title: "Availability Gap",
      value: `${availabilityGap.toFixed(1)}pp`,
      change: availabilityGap,
      trend: availabilityGap > 5 ? ("down" as const) : ("up" as const),
      tooltip: "Best vs. worst platform spread",
    },
  ];

  const severityVariant = (s: "High" | "Medium" | "Low") =>
    s === "High" ? "destructive" : s === "Medium" ? "secondary" : "outline";

  const barColor = (rate: number) =>
    rate >= 95 ? "bg-status-low" : rate >= 90 ? "bg-status-medium" : "bg-status-high";

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
          {kpis.map((kpi, i) => (
            <KPICard key={i} {...kpi} />
          ))}
        </div>
      </section>

      {/* Platform Availability Rates */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Availability Rates</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Platform Availability Rates</CardTitle>
            <CardDescription>% of tracked SKUs currently in stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availabilityByPlatform.map((p) => (
                <div key={p.platform} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{p.platform}</span>
                    <span className="text-muted-foreground">{p.rate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor(p.rate)}`}
                      style={{ width: `${p.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Active Stockout Events */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Stockout Events</h2>
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
