import { useState, useEffect, useMemo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Layers, Hash, Tag } from "lucide-react";
import {
  GlobalFilters,
  DEFAULT_FILTERS,
  getUniqueCategories,
  datasets,
} from "@/data/dataLoader";
import { useData } from "@/contexts/DataContext";
import { RetailCopilot } from "@/components/RetailCopilot";

const CITIES = ["All Cities", "Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];
const PLATFORMS = ["All Platforms", "Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

export function DashboardLayout() {
  const { loaded } = useData();

  const [filters, setFilters] = useState<GlobalFilters>(DEFAULT_FILTERS);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!loaded) return;
    setCategoryOptions(getUniqueCategories());
  }, [loaded]);

  const setFilter = <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  // When city changes, reset pincode to avoid stale selection
  const handleCityChange = (v: string) => {
    setFilters((prev) => ({ ...prev, city: v, pincode: "All Pincodes" }));
  };

  // ── Pincode options: city-dependent ─────────────────────────────────────
  const pincodeOptions = useMemo(() => {
    if (!loaded) return [];
    const s = new Set<string>();
    for (const r of datasets.priceTracking) {
      if (!r.pincode) continue;
      if (filters.city === "All Cities" || r.city === filters.city) {
        s.add(String(r.pincode));
      }
    }
    return Array.from(s).sort();
  }, [loaded, filters.city]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0 min-h-14">
            <SidebarTrigger className="shrink-0" />
            <div className="h-4 w-px bg-border" />

            {/* ── City ── */}
            <Select value={filters.city} onValueChange={handleCityChange}>
              <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[130px] focus:ring-1 hover:bg-muted/70 transition-colors">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ── Pincode (city-dependent) ── */}
            <Select
              value={filters.pincode}
              onValueChange={(v) => setFilter("pincode", v)}
              disabled={pincodeOptions.length === 0}
            >
              <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[140px] focus:ring-1 hover:bg-muted/70 transition-colors">
                <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Pincodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Pincodes" className="text-xs">All Pincodes</SelectItem>
                {pincodeOptions.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs font-mono">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ── Platform ── */}
            <Select value={filters.platform} onValueChange={(v) => setFilter("platform", v)}>
              <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[150px] focus:ring-1 hover:bg-muted/70 transition-colors">
                <Layers className="h-3 w-3 text-muted-foreground shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ── Category ── */}
            {categoryOptions.length > 0 && (
              <Select value={filters.category} onValueChange={(v) => setFilter("category", v)}>
                <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[150px] focus:ring-1 hover:bg-muted/70 transition-colors">
                  <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories" className="text-xs">All Categories</SelectItem>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span>Live</span>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet context={filters} />
          </main>
        </div>
      </div>
      <RetailCopilot filters={filters} />
    </SidebarProvider>
  );
}
