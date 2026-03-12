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
  const availabilityData = getAvailabilityData(selectedCity, "All Platforms");

  // ── Reliability chart data ─────────────────────────────────────────────────
  const reliabilityRaw: Record<string, { available: number; stockout: number; total: number }> = {};
  availabilityData.forEach((row) => {
    if (!reliabilityRaw[row.platform]) reliabilityRaw[row.platform] = { available: 0, stockout: 0, total: 0 };
    reliabilityRaw[row.platform].total++;
    if (row.availability_flag === 1) reliabilityRaw[row.platform].available++;
    else reliabilityRaw[row.platform].stockout++;
  });

  const reliabilityData = Object.entries(reliabilityRaw).map(([platform, d]) => ({
    platform,
    "Availability %": parseFloat(((d.available / d.total) * 100).toFixed(1)),
    "Stockout %": parseFloat(((d.stockout / d.total) * 100).toFixed(1)),
  }));

  // ── Must-Have SKU Availability ─────────────────────────────────────────────
  const mustHaveRaw: Record<string, { sum: number; count: number }> = {};
  availabilityData.forEach((row) => {
    if ((row as any).must_have_flag !== 1) return;
    if (!mustHaveRaw[row.platform]) mustHaveRaw[row.platform] = { sum: 0, count: 0 };
    mustHaveRaw[row.platform].sum += row.availability_flag;
    mustHaveRaw[row.platform].count++;
  });

  const mustHaveData = Object.entries(mustHaveRaw)
    .map(([platform, { sum, count }]) => ({
      platform,
      "Must-Have Availability %": parseFloat(((sum / count) * 100).toFixed(1)),
    }))
    .sort((a, b) => b["Must-Have Availability %"] - a["Must-Have Availability %"]);

  // ── Category Availability Health ──────────────────────────────────────────
  const categoryRaw: Record<string, { sum: number; count: number }> = {};
  availabilityData.forEach((row) => {
    if (!categoryRaw[row.category]) categoryRaw[row.category] = { sum: 0, count: 0 };
    categoryRaw[row.category].sum += row.availability_flag;
    categoryRaw[row.category].count++;
  });

  const categoryAvailData = Object.entries(categoryRaw)
    .map(([category, { sum, count }]) => ({
      category,
      "Availability %": parseFloat(((sum / count) * 100).toFixed(1)),
    }))
    .sort((a, b) => b["Availability %"] - a["Availability %"])
    .slice(0, 8);

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

      {/* Platform Reliability Comparison chart */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Reliability Comparison</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Platform Reliability Comparison</CardTitle>
            <CardDescription>Availability vs stockout rate per platform across all cities</CardDescription>
          </CardHeader>
          <CardContent>
            {reliabilityData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={reliabilityData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="Availability %" fill="hsl(var(--status-low))"      radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Stockout %"     fill="hsl(var(--status-critical))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Must-Have SKU Availability */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Must-Have SKU Availability</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Must-Have SKU Availability</CardTitle>
            <CardDescription>Avg availability rate for critical SKUs (must_have_flag = 1) per platform</CardDescription>
          </CardHeader>
          <CardContent>
            {mustHaveData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No must-have SKU data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mustHaveData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Must-Have Availability"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="Must-Have Availability %" fill="hsl(var(--status-low))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Category Availability Health */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Availability Health</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Category Availability Health</CardTitle>
            <CardDescription>Top 8 categories by avg availability rate — higher % = stronger inventory stability</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryAvailData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data for selected filters.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  layout="vertical"
                  data={categoryAvailData}
                  margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                  <XAxis type="number" unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Availability"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="Availability %" fill="hsl(var(--status-low))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
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
