import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import {
  GlobalFilters,
  DEFAULT_FILTERS,
  getUniquePincodes,
  getUniqueCategories,
  getPincodeCityMap,
} from "@/data/dataLoader";
import { useData } from "@/contexts/DataContext";

const CITIES = ["All Cities", "Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];
const PLATFORMS = ["All Platforms", "Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

export function DashboardLayout() {
  const { loaded } = useData();

  const [filters, setFilters] = useState<GlobalFilters>(DEFAULT_FILTERS);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pincodeOptions, setPincodeOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  // Populate dynamic options once data is loaded
  useEffect(() => {
    if (!loaded) return;
    setPincodeOptions(getUniquePincodes());
    setCategoryOptions(getUniqueCategories());
  }, [loaded]);

  const setFilter = <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setFilters((prev) => ({
      ...prev,
      dateFrom: range?.from ? format(range.from, "yyyy-MM-dd") : "",
      dateTo:   range?.to   ? format(range.to,   "yyyy-MM-dd") : "",
    }));
  };

  const clearDateRange = () => {
    setDateRange(undefined);
    setFilters((prev) => ({ ...prev, dateFrom: "", dateTo: "" }));
  };

  const hasDateFilter = !!filters.dateFrom || !!filters.dateTo;

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
            <Select value={filters.city} onValueChange={(v) => setFilter("city", v)}>
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

            {/* ── Pincode ── */}
            {pincodeOptions.length > 0 && (
              <Select value={filters.pincode} onValueChange={(v) => setFilter("pincode", v)}>
                <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[140px] focus:ring-1 hover:bg-muted/70 transition-colors">
                  <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Pincodes" className="text-xs">All Pincodes</SelectItem>
                  {pincodeOptions.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* ── Date Range ── */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium hover:bg-muted/70 transition-colors",
                    hasDateFilter && "border-primary/40 bg-primary/10 text-primary"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 shrink-0" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "dd MMM")} – ${format(dateRange.to, "dd MMM")}`
                    ) : (
                      format(dateRange.from, "dd MMM yyyy")
                    )
                  ) : (
                    "Date Range"
                  )}
                  {hasDateFilter && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); clearDateRange(); }}
                      onKeyDown={(e) => e.key === "Enter" && clearDateRange()}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

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
    </SidebarProvider>
  );
}
