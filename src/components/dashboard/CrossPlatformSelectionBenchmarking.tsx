import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { datasets, applyFilters, type GlobalFilters } from "@/data/dataLoader";

const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"] as const;

interface Props {
  filters: Partial<GlobalFilters>;
}

type StatusKey = "not_listed" | "out_of_stock" | "in_stock";

function StatusBadge({ status }: { status: StatusKey }) {
  if (status === "not_listed")
    return (
      <Badge className="bg-destructive/10 text-destructive border border-destructive/30 text-xs font-medium whitespace-nowrap">
        ❌ Not Listed
      </Badge>
    );
  if (status === "out_of_stock")
    return (
      <Badge className="bg-status-medium/15 text-status-medium border border-status-medium/30 text-xs font-medium whitespace-nowrap">
        ⚠️ Out of Stock
      </Badge>
    );
  return (
    <Badge className="bg-status-low/15 text-status-low border border-status-low/30 text-xs font-medium whitespace-nowrap">
      ✅ In Stock
    </Badge>
  );
}

export function CrossPlatformSelectionBenchmarking({ filters }: Props) {
  const categories = useMemo(
    () => Array.from(new Set(datasets.skuMaster.map((s) => s.category))).sort(),
    []
  );

  const globalCategory =
    filters.category && filters.category !== "All Categories"
      ? filters.category
      : null;

  const [selectedCategory, setSelectedCategory] = useState<string>(globalCategory ?? "");
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSkuId("");
  };

  const productsInCategory = useMemo(
    () =>
      datasets.skuMaster
        .filter((s) => s.category === selectedCategory)
        .sort((a, b) => a.brand.localeCompare(b.brand) || a.sku_id.localeCompare(b.sku_id)),
    [selectedCategory]
  );

  const selectedSku = useMemo(
    () => (selectedSkuId ? datasets.skuMaster.find((s) => s.sku_id === selectedSkuId) ?? null : null),
    [selectedSkuId]
  );

  // is_regional is not in the current SKUMaster type — treat as always false until data adds it
  const isRegional = useMemo(() => {
    if (!selectedSku) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Boolean((selectedSku as any).is_regional);
  }, [selectedSku]);

  type PlatformStatus = { status: StatusKey };

  const platformStatuses = useMemo((): Record<string, PlatformStatus> => {
    if (!selectedSkuId) return {};

    const baseFilters: Partial<GlobalFilters> = {
      city: filters.city,
      pincode: filters.pincode,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    // Assortment tracking — listing_status per platform
    const assortRows = applyFilters(datasets.assortmentTracking, baseFilters).filter(
      (r) => r.sku_id === selectedSkuId
    );

    // Availability tracking — availability_flag per platform
    const availRows = applyFilters(datasets.availabilityTracking, baseFilters).filter(
      (r) => r.sku_id === selectedSkuId
    );

    const result: Record<string, PlatformStatus> = {};

    for (const platform of PLATFORMS) {
      const asmtRows = assortRows.filter((r) => r.platform === platform);
      const avlRows = availRows.filter((r) => r.platform === platform);

      // Derive listing status: majority vote across rows
      const listingAvg =
        asmtRows.length > 0
          ? asmtRows.reduce((s, r) => s + r.listing_status, 0) / asmtRows.length
          : 0;

      if (asmtRows.length === 0 || listingAvg < 0.5) {
        result[platform] = { status: "not_listed" };
        continue;
      }

      // Derive availability status
      const availAvg =
        avlRows.length > 0
          ? avlRows.reduce((s, r) => s + r.availability_flag, 0) / avlRows.length
          : 0;

      result[platform] = {
        status: availAvg >= 0.5 ? "in_stock" : "out_of_stock",
      };
    }

    return result;
  }, [selectedSkuId, filters]);

  // Actionable Selection Gap: Zepto is "not_listed" AND ≥2 other platforms are "in_stock"
  const isActionableGap = useMemo(() => {
    if (!selectedSkuId || Object.keys(platformStatuses).length === 0) return false;
    const zeptoStatus = platformStatuses["Zepto"]?.status;
    if (zeptoStatus !== "not_listed") return false;
    const otherInStock = PLATFORMS.filter(
      (p) => p !== "Zepto" && platformStatuses[p]?.status === "in_stock"
    ).length;
    return otherInStock >= 2;
  }, [platformStatuses, selectedSkuId]);

  const hasData = selectedSkuId && Object.keys(platformStatuses).length > 0;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Cross-Platform Selection Benchmarking
      </h2>
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <div>
              <CardTitle>Cross-Platform Selection Benchmarking</CardTitle>
              <CardDescription>
                Compare listing and availability status of a product across platforms — identify
                selection gaps where a SKU is unlisted on one platform while available on others
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Selectors */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[240px] flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Product
              </label>
              <Select
                value={selectedSkuId}
                onValueChange={setSelectedSkuId}
                disabled={!selectedCategory}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue
                    placeholder={selectedCategory ? "Select product…" : "Select a category first"}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {productsInCategory.map((s) => (
                    <SelectItem key={s.sku_id} value={s.sku_id}>
                      {s.product_name || s.sku_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCategory && (
              <div className="pb-0.5">
                <Badge variant="secondary" className="text-xs font-normal gap-1">
                  {selectedCategory} · {productsInCategory.length} product
                  {productsInCategory.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
          </div>

          {/* Actionable gap banner */}
          {isActionableGap && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/8 px-4 py-2.5">
              <span className="text-sm font-semibold text-destructive">⚠ Actionable Selection Gap Detected</span>
              <span className="text-xs text-destructive/80">
                — Zepto is not listing this SKU while competitors carry it
              </span>
            </div>
          )}

          {/* Results */}
          {!selectedSkuId ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Select a category and product to view listing status across platforms.
            </p>
          ) : !hasData ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No assortment data found for the selected SKU under current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[220px]">
                      Product Name
                    </th>
                    {PLATFORMS.map((p) => (
                      <th key={p} className="text-center py-2 px-3 font-medium text-muted-foreground min-w-[140px]">
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className={
                      isActionableGap
                        ? "border-b border-border/40 bg-destructive/5 relative"
                        : "border-b border-border/40"
                    }
                  >
                    {/* Product name cell */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-2">
                        {/* Red left-edge indicator for actionable gap */}
                        {isActionableGap && (
                          <div className="w-1 self-stretch rounded-full bg-destructive shrink-0 -ml-1 mr-1" />
                        )}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium leading-tight">
                              {selectedSku?.product_name || selectedSkuId}
                            </span>
                            {isRegional && (
                              <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Regional
                              </span>
                            )}
                          </div>
                          {isActionableGap && (
                            <span className="inline-flex items-center text-[10px] font-semibold text-destructive uppercase tracking-wider">
                              Actionable Selection Gap
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {selectedSku?.brand} · {selectedSku?.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Platform status cells */}
                    {PLATFORMS.map((platform) => {
                      const ps = platformStatuses[platform];
                      return (
                        <td key={platform} className="py-3 px-3 text-center">
                          {ps ? (
                            <StatusBadge status={ps.status} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-status-low/30 bg-status-low/15 px-2 py-0.5 text-status-low text-[10px] font-medium">✅ In Stock</span>
              <span>listing_status=1 & available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-status-medium/30 bg-status-medium/15 px-2 py-0.5 text-status-medium text-[10px] font-medium">⚠️ Out of Stock</span>
              <span>listing_status=1 & unavailable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-destructive text-[10px] font-medium">❌ Not Listed</span>
              <span>listing_status=0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
