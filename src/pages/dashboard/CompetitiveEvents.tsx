import { KPICard } from "@/components/dashboard/KPICard";
import { getEvents } from "@/data/dataLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { useOutletContext } from "react-router-dom";

interface DashboardContext {
  selectedCity: string;
  selectedPlatform: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  price_drop: "Price Drop",
  flash_sale: "Flash Sale",
  bundle_offer: "Bundle Offer",
  promo_spike: "Promo Spike",
  stockout_spike: "Stockout Spike",
  new_sku_launch: "New SKU Launch",
};

type SeverityVariant = "destructive" | "secondary" | "outline" | "default";

function severityVariant(eventType: string): SeverityVariant {
  if (["price_drop", "stockout_spike"].includes(eventType)) return "destructive";
  if (["flash_sale", "promo_spike"].includes(eventType)) return "secondary";
  return "outline";
}

function severityLabel(eventType: string): string {
  if (["price_drop", "stockout_spike"].includes(eventType)) return "High";
  if (["flash_sale", "promo_spike"].includes(eventType)) return "Medium";
  return "Low";
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const CompetitiveEvents = () => {
  const { selectedCity, selectedPlatform } = useOutletContext<DashboardContext>();

  const events = getEvents(selectedCity, selectedPlatform);

  const priceDrops = events.filter((e) => e.event_type === "price_drop").length;
  const promos = events.filter((e) =>
    ["flash_sale", "bundle_offer", "promo_spike"].includes(e.event_type)
  ).length;
  const stockouts = events.filter((e) => e.event_type === "stockout_spike").length;

  const kpis = [
    {
      title: "Events Detected",
      value: events.length.toString(),
      trend: "neutral" as const,
      tooltip: "Total competitive events in the filtered dataset",
    },
    {
      title: "Price Drop Alerts",
      value: priceDrops.toString(),
      trend: priceDrops > 0 ? ("down" as const) : ("neutral" as const),
      status: priceDrops > 2 ? ("high" as const) : ("low" as const),
      tooltip: "Events where a competitor reduced prices",
    },
    {
      title: "Promotion Alerts",
      value: promos.toString(),
      trend: promos > 0 ? ("up" as const) : ("neutral" as const),
      status: promos > 3 ? ("medium" as const) : ("low" as const),
      tooltip: "Flash sales, bundle offers, and promotional spikes detected",
    },
    {
      title: "Stockout Alerts",
      value: stockouts.toString(),
      trend: stockouts > 0 ? ("down" as const) : ("neutral" as const),
      status: stockouts > 1 ? ("high" as const) : ("low" as const),
      tooltip: "Stockout spike events detected across platforms",
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Competitive Event Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Detected competitor events: price drops, flash promos, stockout spikes, and new launches
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

      {/* Event Feed */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Live Event Feed</h2>
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Live Event Feed</CardTitle>
            <CardDescription>
              {events.length} event{events.length !== 1 ? "s" : ""} detected
              {selectedCity !== "All Cities" ? ` · ${selectedCity}` : ""}
              {selectedPlatform !== "All Platforms" ? ` · ${selectedPlatform}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No events found for the selected filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Date</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Platform</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">City</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Category</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Event Type</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Severity</th>
                      <th className="py-2 font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e, i) => (
                      <tr key={e.event_id ?? i} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(e.date)}
                        </td>
                        <td className="py-2 pr-4 font-medium">{e.platform}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{e.city}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{e.category}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {EVENT_TYPE_LABELS[e.event_type] ?? e.event_type}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={severityVariant(e.event_type)} className="text-xs">
                            {severityLabel(e.event_type)}
                          </Badge>
                        </td>
                        <td className="py-2 text-muted-foreground text-xs max-w-xs">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CompetitiveEvents;
