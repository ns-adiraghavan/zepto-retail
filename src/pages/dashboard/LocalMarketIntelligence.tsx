import { KPICard } from "@/components/dashboard/KPICard";
import { GlobalFilters, datasets } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { SKUCrossPlatformComparison } from "@/components/dashboard/SKUCrossPlatformComparison";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { StrategicInsightsPanel, type Insight } from "@/components/dashboard/StrategicInsightsPanel";

const CITIES = ["Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];

function avg(arr: number[]) {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

/** Two-stage aggregation: group rows by (platform, pincode), compute metric avg per group, then avg across groups */
function twoStageAvg<T>(
  rows: T[],
  keyFn: (r: T) => string,
  valueFn: (r: T) => number
): number {
  const groups: Record<string, number[]> = {};
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups[key]) groups[key] = [];
    groups[key].push(valueFn(row));
  }
  const groupAvgs = Object.values(groups).map((vals) => avg(vals));
  return avg(groupAvgs);
}

/** Population stddev of values */
function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const variance = avg(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

/** Price variance: stddev of per-pincode avg sale prices */
function cityPriceVariance(cityName: string, otherFilters: Partial<GlobalFilters>): number {
  const rows = datasets.priceTracking.filter((r) => {
    if (r.city !== cityName) return false;
    if (otherFilters.platform && otherFilters.platform !== "All Platforms" && r.platform !== otherFilters.platform) return false;
    if (otherFilters.category && otherFilters.category !== "All Categories" && r.category !== otherFilters.category) return false;
    if (otherFilters.dateFrom && r.date < otherFilters.dateFrom) return false;
    if (otherFilters.dateTo   && r.date > otherFilters.dateTo)   return false;
    return true;
  });

  // group by pincode → avg sale_price per pincode
  const byPincode: Record<string, number[]> = {};
  for (const row of rows) {
    const key = row.pincode ?? "unknown";
    if (!byPincode[key]) byPincode[key] = [];
    byPincode[key].push(row.sale_price);
  }
  const pincodeAvgs = Object.values(byPincode).map((v) => avg(v));
  return parseFloat(stddev(pincodeAvgs).toFixed(2));
}

const LocalMarketIntelligence = () => {
  const { city, platform, pincode, category, dateFrom, dateTo } = useOutletContext<GlobalFilters>();
  const otherFilters: Partial<GlobalFilters> = { platform, pincode, category, dateFrom, dateTo };

  const cityScores = useMemo(() =>
    CITIES.map((c) => {
      // ── Availability: two-stage groupBy(platform, pincode) ────────────────
      const availRows = datasets.availabilityTracking.filter((r) => {
        if (r.city !== c) return false;
        if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
        if (pincode && pincode !== "All Pincodes" && r.pincode !== undefined && r.pincode !== pincode) return false;
        if (category && category !== "All Categories" && r.category !== category) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      });
      const availability = twoStageAvg(
        availRows,
        (r) => `${r.platform}||${r.pincode ?? ""}`,
        (r) => r.availability_flag * 100
      );

      // ── Discount: two-stage groupBy(platform, pincode) ───────────────────
      const priceRows = datasets.priceTracking.filter((r) => {
        if (r.city !== c) return false;
        if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
        if (pincode && pincode !== "All Pincodes" && r.pincode !== undefined && r.pincode !== pincode) return false;
        if (category && category !== "All Categories" && r.category !== category) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      });
      const discount = twoStageAvg(
        priceRows,
        (r) => `${r.platform}||${r.pincode ?? ""}`,
        (r) => r.discount_percent
      );
      const promoRate = twoStageAvg(
        priceRows,
        (r) => `${r.platform}||${r.pincode ?? ""}`,
        (r) => r.promotion_flag * 100
      );

      // ── Search: two-stage groupBy(platform, pincode) ─────────────────────
      const searchRows = datasets.searchRankTracking.filter((r) => {
        if (r.city !== c) return false;
        if (platform && platform !== "All Platforms" && r.platform !== platform) return false;
        if (pincode && pincode !== "All Pincodes" && r.pincode !== undefined && r.pincode !== pincode) return false;
        if (category && category !== "All Categories" && r.category !== category) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo   && r.date > dateTo)   return false;
        return true;
      });
      const search = twoStageAvg(
        searchRows,
        (r) => `${r.platform}||${r.pincode ?? ""}`,
        (r) => (r.sponsored_flag ?? 0) * 100
      );

      // ── Price variance ────────────────────────────────────────────────────
      const priceVariance = cityPriceVariance(c, otherFilters);

      const score = Math.round((availability + search + (100 - discount)) / 3);

      return { city: c, availability, discount, promoRate, search, priceVariance, score };
    }),
  [platform, pincode, category, dateFrom, dateTo]);

  const sortedByScore = [...cityScores].sort((a, b) => b.score - a.score);
  const bestCity = sortedByScore[0];
  const worstCity = sortedByScore[sortedByScore.length - 1];
  const avgScore = avg(cityScores.map((c) => c.score));
  const highestVarianceCity = [...cityScores].sort((a, b) => b.priceVariance - a.priceVariance)[0];

  const kpis = [
    { title: "Avg City Score", value: avgScore.toFixed(1), trend: "neutral" as const, tooltip: "Composite score averaged across all five cities (two-stage aggregation)" },
    { title: "Best Performing City", value: bestCity?.city ?? "—", change: bestCity?.score, changeType: "absolute" as const, trend: "up" as const, tooltip: "City with the highest composite intelligence score" },
    { title: "Lowest Performing City", value: worstCity?.city ?? "—", change: worstCity?.score, changeType: "absolute" as const, trend: "down" as const, tooltip: "City with the lowest composite intelligence score" },
    { title: "Hyperlocal Price Variance", value: highestVarianceCity ? `₹${highestVarianceCity.priceVariance}` : "—", trend: highestVarianceCity?.priceVariance > 4 ? "down" as const : "neutral" as const, tooltip: `Highest price std-dev across pincodes — ${highestVarianceCity?.city ?? "—"} leads` },
  ];

  const cityChartData = cityScores.map((c) => ({
    city: c.city,
    Score: c.score,
    Availability: parseFloat(c.availability.toFixed(1)),
    "Search Visibility": parseFloat(c.search.toFixed(1)),
    "Price Competitiveness": parseFloat((100 - c.discount).toFixed(1)),
  }));

  const barColor = (score: number) =>
    score >= 80 ? "bg-status-low" : score >= 70 ? "bg-status-medium" : "bg-status-high";

  // ── Strategic Insights ───────────────────────────────────────────────────────
  const topCity = sortedByScore[0];
  
  const lowestAvailCity = [...cityScores].sort((a, b) => a.availability - b.availability)[0];
  const highPromoCity = [...cityScores].sort((a, b) => b.promoRate - a.promoRate)[0];

  const insights: Insight[] = [
    topCity
      ? { icon: "pin", title: "Most Competitive City", body: `${topCity.city} leads with a composite score of ${topCity.score}/100, driven by strong availability (${topCity.availability.toFixed(0)}%) and search visibility across its platform-pincode clusters.`, type: "positive" }
      : { icon: "pin", title: "Most Competitive City", body: "No city data available.", type: "neutral" },
    highestVarianceCity
      ? { icon: "tag", title: "Hyperlocal Price Hotspot", body: `${highestVarianceCity.city} shows the highest hyperlocal price variation (₹${highestVarianceCity.priceVariance} std-dev), indicating significant price inconsistency across its pincodes.`, type: highestVarianceCity.priceVariance > 5 ? "warning" : "neutral" }
      : { icon: "tag", title: "Hyperlocal Price Hotspot", body: "No variance data available.", type: "neutral" },
    lowestAvailCity
      ? { icon: "trend-down", title: "Regional Availability Gap", body: `${lowestAvailCity.city} has the lowest two-stage availability rate at ${lowestAvailCity.availability.toFixed(1)}%, suggesting elevated stockout risk across its platform-pincode combinations.`, type: lowestAvailCity.availability < 80 ? "critical" : "warning" }
      : { icon: "trend-down", title: "Regional Availability Gap", body: "No availability data available.", type: "neutral" },
    highPromoCity
      ? { icon: "tag", title: "Highest Promo Intensity", body: `${highPromoCity.city} has the most promotional activity at ${highPromoCity.promoRate.toFixed(1)}% promo rate — monitor for margin pressure.`, type: "warning" }
      : { icon: "tag", title: "Highest Promo Intensity", body: "No promo data.", type: "neutral" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
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

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KPI Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </section>

      <StrategicInsightsPanel insights={insights} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">City Competitiveness Comparison</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>City Competitiveness Comparison</CardTitle>
            <CardDescription>Score, availability, search visibility, and price competitiveness per city (two-stage aggregation)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cityChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Score"                 fill="hsl(var(--status-low))"    radius={[4, 4, 0, 0]} />
                <Bar dataKey="Availability"          fill="hsl(221 83% 53%)"          radius={[4, 4, 0, 0]} />
                <Bar dataKey="Search Visibility"     fill="hsl(270 70% 55%)"          radius={[4, 4, 0, 0]} />
                <Bar dataKey="Price Competitiveness" fill="hsl(var(--status-medium))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">City Intelligence Scores</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>City Intelligence Scores</CardTitle>
            <CardDescription>Composite score: availability + search visibility − discount intensity (platform × pincode aggregation)</CardDescription>
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
                      <span>Promo {c.promoRate.toFixed(0)}%</span>
                      <span>±₹{c.priceVariance}</span>
                      <span className="font-semibold text-foreground">{c.score}/100</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${barColor(c.score)}`} style={{ width: `${c.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hyperlocal Price Variance by City</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Hyperlocal Price Variance</CardTitle>
            <CardDescription>Std-dev of avg sale price across pincodes — highlights cities with inconsistent pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...cityScores].sort((a, b) => b.priceVariance - a.priceVariance).map((c) => {
                const maxVariance = Math.max(...cityScores.map((x) => x.priceVariance), 1);
                const pct = Math.round((c.priceVariance / maxVariance) * 100);
                const color = c.priceVariance > 5 ? "bg-status-high" : c.priceVariance > 3 ? "bg-status-medium" : "bg-status-low";
                return (
                  <div key={c.city} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{c.city}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">₹{c.priceVariance}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <SKUCrossPlatformComparison filters={{ city, pincode, category, dateFrom, dateTo }} />
    </div>
  );
};

export default LocalMarketIntelligence;
