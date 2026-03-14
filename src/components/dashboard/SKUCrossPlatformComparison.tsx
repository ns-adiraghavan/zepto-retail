import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { datasets, applyFilters, type GlobalFilters } from "@/data/dataLoader";

const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

interface Props {
  filters: Partial<GlobalFilters>;
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

export function SKUCrossPlatformComparison({ filters }: Props) {
  const [query, setQuery] = useState("");
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Build SKU list from sku_master
  const skuOptions = useMemo(
    () =>
      datasets.skuMaster
        .filter(
          (s) =>
            !query || s.product_name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 12),
    [query]
  );

  const selectedSku = useMemo(
    () => datasets.skuMaster.find((s) => s.sku_id === selectedSkuId),
    [selectedSkuId]
  );

  // Comparison table data: one row per platform
  const comparisonRows = useMemo(() => {
    if (!selectedSkuId) return [];

    // Build filters without the platform dimension so we can iterate per-platform
    const baseFilters: Partial<GlobalFilters> = {
      city: filters.city,
      pincode: filters.pincode,
      category: filters.category,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const priceBase = applyFilters(datasets.priceTracking, baseFilters).filter(
      (r) => r.sku_id === selectedSkuId
    );
    const availBase = applyFilters(
      datasets.availabilityTracking,
      baseFilters
    ).filter((r) => r.sku_id === selectedSkuId);

    return PLATFORMS.map((platform) => {
      const priceRows = priceBase.filter((r) => r.platform === platform);
      const availRows = availBase.filter((r) => r.platform === platform);

      if (priceRows.length === 0 && availRows.length === 0) {
        return { platform, listed: false };
      }

      const salePrice = avg(priceRows.map((r) => r.sale_price));
      const discountPct = avg(priceRows.map((r) => r.discount_percent));
      const promoFlag = avg(priceRows.map((r) => r.promotion_flag));
      const availFlag = avg(availRows.map((r) => r.availability_flag));

      // Most common promotion_type among rows with one
      const promoTypes = priceRows
        .map((r) => r.promotion_type)
        .filter(Boolean) as string[];
      const promoTypeMap: Record<string, number> = {};
      promoTypes.forEach((t) => {
        promoTypeMap[t] = (promoTypeMap[t] ?? 0) + 1;
      });
      const promoType =
        Object.entries(promoTypeMap).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "—";

      return {
        platform,
        listed: true,
        salePrice,
        discountPct,
        promoFlag,
        promoType,
        availFlag,
      };
    });
  }, [selectedSkuId, filters]);

  type ListedRow = {
    platform: string;
    listed: true;
    salePrice: number;
    discountPct: number;
    promoFlag: number;
    promoType: string;
    availFlag: number;
  };
  type UnlistedRow = { platform: string; listed: false };

  const availBadge = (flag: number) =>
    flag >= 0.8 ? (
      <Badge className="bg-status-low/20 text-status-low border border-status-low/30 text-xs">
        In Stock
      </Badge>
    ) : flag >= 0.4 ? (
      <Badge className="bg-status-medium/20 text-status-medium border border-status-medium/30 text-xs">
        Low Stock
      </Badge>
    ) : (
      <Badge className="bg-status-critical/20 text-status-critical border border-status-critical/30 text-xs">
        Out of Stock
      </Badge>
    );

  const promoBadge = (flag: number) =>
    flag >= 0.5 ? (
      <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs">
        Yes
      </Badge>
    ) : (
      <span className="text-xs text-muted-foreground">No</span>
    );

  const discountColor = (pct: number) =>
    pct >= 20
      ? "text-status-critical font-semibold"
      : pct >= 10
      ? "text-status-medium font-medium"
      : "text-muted-foreground";

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
                Compare price, discount, promotions, and availability for a
                single product across all platforms — filtered by active city,
                pincode, category, and date selection
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SKU search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 text-sm"
              placeholder="Search product name…"
              value={selectedSku ? selectedSku.product_name : query}
              onFocus={() => {
                if (selectedSku) setQuery("");
                setOpen(true);
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedSkuId(null);
                setOpen(true);
              }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {open && skuOptions.length > 0 && !selectedSkuId && (
              <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-56 overflow-y-auto text-sm">
                {skuOptions.map((s) => (
                  <li
                    key={s.sku_id}
                    className="px-3 py-2 cursor-pointer hover:bg-muted transition-colors flex items-center justify-between gap-2"
                    onMouseDown={() => {
                      setSelectedSkuId(s.sku_id);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium truncate">{s.product_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {s.category}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Active filter context */}
          {(filters.city && filters.city !== "All Cities") ||
          (filters.pincode && filters.pincode !== "All Pincodes") ||
          (filters.category && filters.category !== "All Categories") ? (
            <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
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
              {filters.category && filters.category !== "All Categories" && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {filters.category}
                </Badge>
              )}
            </div>
          ) : null}

          {/* Table */}
          {!selectedSkuId ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Search and select a product above to compare pricing across
              platforms.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[140px]">
                      Platform
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground min-w-[90px]">
                      Price (₹)
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground min-w-[90px]">
                      Discount %
                    </th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground min-w-[90px]">
                      Promotion
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[120px]">
                      Promo Type
                    </th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground min-w-[110px]">
                      Availability
                    </th>
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
                          <td className="py-2.5 px-3 font-medium">
                            {row.platform}
                          </td>
                          <td
                            colSpan={5}
                            className="py-2.5 px-3 text-center text-xs text-muted-foreground italic"
                          >
                            Not Listed
                          </td>
                        </tr>
                      );
                    }
                    const r = row as ListedRow;
                    return (
                      <tr
                        key={r.platform}
                        className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold">
                          {r.platform}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">
                          ₹{r.salePrice.toFixed(2)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right ${discountColor(
                            r.discountPct
                          )}`}
                        >
                          {r.discountPct.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {promoBadge(r.promoFlag)}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">
                          {r.promoFlag >= 0.5 ? r.promoType : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {availBadge(r.availFlag)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Selected SKU meta */}
          {selectedSku && (
            <p className="text-xs text-muted-foreground pt-1">
              SKU:{" "}
              <span className="font-mono">{selectedSku.sku_id}</span> ·{" "}
              {selectedSku.brand} · {selectedSku.pack_size}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
