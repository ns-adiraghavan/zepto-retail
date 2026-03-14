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
import { ArrowLeftRight, MapPin } from "lucide-react";
import { datasets, applyFilters, type GlobalFilters } from "@/data/dataLoader";

const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

interface Props {
  filters: Partial<GlobalFilters>;
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

/** Resolve product name from skuMaster; fall back to "Unknown Product" */
function resolveProductName(s: { product_name?: string } | null | undefined): string {
  return s?.product_name || "Unknown Product";
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function AvailBadge({ flag }: { flag: number }) {
  if (flag >= 0.8)
    return (
      <Badge className="bg-status-low/20 text-status-low border border-status-low/30 text-xs">
        In Stock
      </Badge>
    );
  if (flag >= 0.4)
    return (
      <Badge className="bg-status-medium/20 text-status-medium border border-status-medium/30 text-xs">
        Low Stock
      </Badge>
    );
  return (
    <Badge className="bg-status-critical/20 text-status-critical border border-status-critical/30 text-xs">
      Out of Stock
    </Badge>
  );
}

function PromoBadge({ flag }: { flag: number }) {
  return flag >= 0.5 ? (
    <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs">
      Yes
    </Badge>
  ) : (
    <span className="text-xs text-muted-foreground">No</span>
  );
}

function discountColor(pct: number) {
  if (pct >= 20) return "text-status-critical font-semibold";
  if (pct >= 10) return "text-status-medium font-medium";
  return "text-muted-foreground";
}

// ─── Main component ────────────────────────────────────────────────────────────

export function SKUCrossPlatformComparison({ filters }: Props) {
  const categories = useMemo(
    () =>
      Array.from(new Set(datasets.skuMaster.map((s) => s.category))).sort(),
    []
  );

  const globalCategory =
    filters.category && filters.category !== "All Categories"
      ? filters.category
      : null;

  const [selectedCategory, setSelectedCategory] = useState<string>(
    globalCategory ?? ""
  );
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

  const categoryProductCount = productsInCategory.length;

  const selectedSku = useMemo(
    () =>
      selectedSkuId
        ? (datasets.skuMaster.find((s) => s.sku_id === selectedSkuId) ?? null)
        : null,
    [selectedSkuId]
  );

  // ── Platform comparison rows ──────────────────────────────────────────────
  const comparisonRows = useMemo(() => {
    if (!selectedSkuId) return [];

    const baseFilters: Partial<GlobalFilters> = {
      city: filters.city,
      pincode: filters.pincode,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const priceBase = applyFilters(datasets.priceTracking, baseFilters).filter(
      (r) => r.sku_id === selectedSkuId
    );
    const availBase = applyFilters(datasets.availabilityTracking, baseFilters).filter(
      (r) => r.sku_id === selectedSkuId
    );

    return PLATFORMS.map((platform) => {
      const priceRows = priceBase.filter((r) => r.platform === platform);
      const availRows = availBase.filter((r) => r.platform === platform);

      if (priceRows.length === 0 && availRows.length === 0) {
        return { platform, listed: false as const };
      }

      const salePrice = avg(priceRows.map((r) => r.sale_price));
      const discountPct = avg(priceRows.map((r) => r.discount_percent));
      const promoFlag = avg(priceRows.map((r) => r.promotion_flag));
      const availFlag = avg(availRows.map((r) => r.availability_flag));

      const promoTypeMap: Record<string, number> = {};
      priceRows
        .map((r) => r.promotion_type)
        .filter(Boolean)
        .forEach((t) => {
          promoTypeMap[t!] = (promoTypeMap[t!] ?? 0) + 1;
        });
      const promoType =
        Object.entries(promoTypeMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

      return {
        platform,
        listed: true as const,
        salePrice,
        discountPct,
        promoFlag,
        promoType,
        availFlag,
      };
    });
  }, [selectedSkuId, filters]);

  // ── Hyperlocal price context rows ─────────────────────────────────────────
  type HyperlocalRow = {
    city: string;
    pincode: string;
    platform: string;
    avgPrice: number;
  };

  const hyperlocalRows = useMemo((): HyperlocalRow[] => {
    if (!selectedSkuId) return [];

    const dateFilters: Partial<GlobalFilters> = {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const rows = applyFilters(datasets.priceTracking, dateFilters).filter(
      (r) => r.sku_id === selectedSkuId && r.pincode && r.city
    );

    const grouped: Record<string, { sum: number; count: number }> = {};
    for (const r of rows) {
      const key = `${r.city}||${r.pincode}||${r.platform}`;
      if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
      grouped[key].sum += r.sale_price;
      grouped[key].count += 1;
    }

    return Object.entries(grouped)
      .map(([key, { sum, count }]) => {
        const [city, pincode, platform] = key.split("||");
        return { city, pincode, platform, avgPrice: sum / count };
      })
      .sort((a, b) => a.city.localeCompare(b.city) || a.pincode.localeCompare(b.pincode));
  }, [selectedSkuId, filters]);

  const hasActiveFilters =
    (filters.city && filters.city !== "All Cities") ||
    (filters.pincode && filters.pincode !== "All Pincodes");

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Cross-Platform Product Comparison
      </h2>
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            <div>
              <CardTitle>Cross-Platform Product Comparison</CardTitle>
              <CardDescription>
                Select a category and product to compare price, discount,
                promotions, and availability across all platforms — filtered by
                active city, pincode, and date selection
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Selectors row ── */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Category */}
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

            {/* Product */}
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
                    placeholder={
                      selectedCategory ? "Select product…" : "Select a category first"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {productsInCategory.map((s) => (
                    <SelectItem key={s.sku_id} value={s.sku_id}>
                      {resolveProductName(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category context badge */}
            {selectedCategory && (
              <div className="pb-0.5">
                <Badge variant="secondary" className="text-xs font-normal gap-1">
                  {selectedCategory} · {categoryProductCount} product
                  {categoryProductCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
          </div>

          {/* ── Active geo-filter context ── */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground items-center">
              <span className="font-medium">Filters active:</span>
              {filters.city && filters.city !== "All Cities" && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {filters.city}
                </Badge>
              )}
              {filters.pincode && filters.pincode !== "All Pincodes" && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {filters.pincode}
                </Badge>
              )}
            </div>
          )}

          {/* ── Selected product header ── */}
          {selectedSku && (
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
              <p className="font-semibold text-sm leading-tight">
                {skuLabel(selectedSku)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedSku.category}
              </p>
            </div>
          )}

          {/* ── Platform comparison table ── */}
          {!selectedSkuId ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Select a category and product above to compare pricing across platforms.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      { label: "Platform", align: "left", w: "min-w-[140px]" },
                      { label: "Price (₹)", align: "right", w: "min-w-[90px]" },
                      { label: "Discount %", align: "right", w: "min-w-[90px]" },
                      { label: "Promotion", align: "center", w: "min-w-[90px]" },
                      { label: "Promo Type", align: "left", w: "min-w-[120px]" },
                      { label: "Availability", align: "center", w: "min-w-[110px]" },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`text-${h.align} py-2 px-3 font-medium text-muted-foreground ${h.w}`}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => {
                    if (!row.listed) {
                      return (
                        <tr
                          key={row.platform}
                          className="border-b border-border/40 last:border-0 opacity-50"
                        >
                          <td className="py-2.5 px-3 font-medium">{row.platform}</td>
                          <td
                            colSpan={5}
                            className="py-2.5 px-3 text-center text-xs text-muted-foreground italic"
                          >
                            Not Listed
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr
                        key={row.platform}
                        className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold">{row.platform}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">
                          ₹{row.salePrice.toFixed(2)}
                        </td>
                        <td className={`py-2.5 px-3 text-right ${discountColor(row.discountPct)}`}>
                          {row.discountPct.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <PromoBadge flag={row.promoFlag} />
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">
                          {row.promoFlag >= 0.5 ? row.promoType : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <AvailBadge flag={row.availFlag} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Hyperlocal Price Context ── */}
          {hyperlocalRows.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hyperlocal Price Context
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Average sale price by city · pincode · platform for the selected product
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {["City", "Pincode", "Platform", "Avg Price"].map((h) => (
                        <th
                          key={h}
                          className={`py-1.5 px-3 font-medium text-muted-foreground text-xs ${
                            h === "Avg Price" ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hyperlocalRows.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-2 px-3 text-xs">{r.city}</td>
                        <td className="py-2 px-3 font-mono text-xs">{r.pincode}</td>
                        <td className="py-2 px-3 text-xs">{r.platform}</td>
                        <td className="py-2 px-3 text-right font-mono text-xs font-medium">
                          ₹{r.avgPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
