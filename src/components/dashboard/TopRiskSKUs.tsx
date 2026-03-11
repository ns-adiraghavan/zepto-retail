import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Calculator, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useSKUAdjustment } from "@/contexts/SKUAdjustmentContext";

interface RiskSKU {
  sku: string;
  name: string;
  category: string;
  currentPrice: string;
  competitorAvg: string;
  gap: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  marginPercent?: number;
  elasticityScore: number;
  promoResponse: 'High' | 'Medium' | 'Low';
}

interface TopRiskSKUsProps {
  skus: RiskSKU[];
}

export function TopRiskSKUs({ skus }: TopRiskSKUsProps) {
  const [adjustedPrices, setAdjustedPrices] = useState<Record<string, { price: number; margin: number }>>({});
  const [selectedSKU, setSelectedSKU] = useState<RiskSKU | null>(null);
  const [targetMargin, setTargetMargin] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const { toast } = useToast();
  const { getSKUAdjustment, hasAdjustment } = useSKUAdjustment();

  const calculatePriceFromMargin = (currentPrice: number, newMargin: number) => {
    // Assuming cost = price * (1 - old margin / 100)
    // New price = cost / (1 - new margin / 100)
    const currentMargin = selectedSKU?.marginPercent || 25; // Default if not available
    const cost = currentPrice * (1 - currentMargin / 100);
    return cost / (1 - newMargin / 100);
  };

  const calculateMarginFromPrice = (newPrice: number, currentPrice: number) => {
    const currentMargin = selectedSKU?.marginPercent || 25;
    const cost = currentPrice * (1 - currentMargin / 100);
    return ((newPrice - cost) / newPrice) * 100;
  };

  const handleApplyAdjustment = () => {
    if (!selectedSKU) return;
    
    const currentPrice = parseFloat(selectedSKU.currentPrice.replace('₹', '').replace(',', ''));
    let newPrice: number;
    let newMargin: number;
    
    if (targetPrice) {
      newPrice = parseFloat(targetPrice);
      newMargin = calculateMarginFromPrice(newPrice, currentPrice);
    } else if (targetMargin) {
      newMargin = parseFloat(targetMargin);
      newPrice = calculatePriceFromMargin(currentPrice, newMargin);
    } else {
      return;
    }
    
    setAdjustedPrices(prev => ({
      ...prev,
      [selectedSKU.sku]: { price: newPrice, margin: newMargin }
    }));
    
    setSelectedSKU(null);
    setTargetMargin("");
    setTargetPrice("");
    
    toast({
      title: "Pricing Adjusted",
      description: `${selectedSKU.name} pricing updated. New price: ₹${newPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${newMargin.toFixed(1)}% margin)`,
    });
  };
  const getRiskColor = (riskLevel: RiskSKU['riskLevel']) => {
    switch (riskLevel) {
      case 'Critical':
        return 'text-status-critical bg-status-critical/10 border-status-critical/20';
      case 'High':
        return 'text-status-high bg-status-high/10 border-status-high/20';
      case 'Medium':
        return 'text-status-medium bg-status-medium/10 border-status-medium/20';
      default:
        return 'text-status-low bg-status-low/10 border-status-low/20';
    }
  };

  const getRiskBadgeVariant = (riskLevel: RiskSKU['riskLevel']) => {
    switch (riskLevel) {
      case 'Critical':
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getElasticityColor = (score: number) => {
    if (score > 7) return 'text-green-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getPromoResponseColor = (response: string) => {
    switch (response) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top 5 High-Risk SKUs</CardTitle>
          <Button variant="outline" size="sm">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
        {skus.map((sku, index) => {
            // Check for both local adjustments and global adjustments
            const localAdjusted = adjustedPrices[sku.sku];
            const globalAdjustment = getSKUAdjustment(sku.sku);
            const hasGlobalAdjustment = hasAdjustment(sku.sku);
            
            // Priority: global adjustment > local adjustment > original
            const displayPrice = globalAdjustment 
              ? `₹${globalAdjustment.adjustedPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
              : localAdjusted 
                ? `₹${localAdjusted.price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
                : sku.currentPrice;
            
            const displayMargin = globalAdjustment
              ? `${globalAdjustment.adjustedMargin.toFixed(1)}%`
              : localAdjusted 
                ? `${localAdjusted.margin.toFixed(1)}%` 
                : (sku.marginPercent ? `${sku.marginPercent}%` : 'N/A');
            
            const isAdjusted = hasGlobalAdjustment || !!localAdjusted;
            
            return (
              <div
                key={sku.sku}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-105 transform",
                  getRiskColor(sku.riskLevel),
                  isAdjusted && "ring-2 ring-primary/20 bg-primary/5 border-primary/30"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium text-sm">{sku.name}</span>
                    {isAdjusted && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                          Adjusted
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getRiskBadgeVariant(sku.riskLevel)} className="text-xs">
                      {sku.riskLevel}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", getElasticityColor(sku.elasticityScore))}>
                      E: {sku.elasticityScore}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", getPromoResponseColor(sku.promoResponse))}>
                      {sku.promoResponse}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">SKU</div>
                    <div className="font-mono">{sku.sku}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Category</div>
                    <div>{sku.category}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Our Price</div>
                    <div className={cn(
                      "font-medium",
                      isAdjusted && "text-primary"
                    )}>
                      {displayPrice}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Margin</div>
                    <div className={cn(
                      "font-medium",
                      isAdjusted && "text-primary"
                    )}>
                      {displayMargin}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Price Gap: </span>
                    <span className={cn(
                      "font-medium",
                      sku.gap.startsWith('+') ? 'text-status-high' : 'text-status-low'
                    )}>
                      {sku.gap}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/sku/${sku.sku}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2"
                      >
                        Analyze
                      </Button>
                    </Link>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => setSelectedSKU(sku)}
                        >
                          <Calculator className="h-3 w-3 mr-1" />
                          Adjust
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Adjust Pricing - {sku.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Current Price:</span>
                              <div className="font-medium">{sku.currentPrice}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Current Margin:</span>
                              <div className="font-medium">{sku.marginPercent ? `${sku.marginPercent}%` : 'N/A'}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="target-price">Target Price (₹)</Label>
                              <Input
                                id="target-price"
                                type="number"
                                step="0.01"
                                value={targetPrice}
                                onChange={(e) => {
                                  setTargetPrice(e.target.value);
                                  setTargetMargin(""); // Clear margin when price is set
                                }}
                                placeholder="Enter new price"
                              />
                            </div>
                            
                            <div className="text-center text-xs text-muted-foreground">OR</div>
                            
                            <div>
                              <Label htmlFor="target-margin">Target Margin (%)</Label>
                              <Input
                                id="target-margin"
                                type="number"
                                step="0.1"
                                value={targetMargin}
                                onChange={(e) => {
                                  setTargetMargin(e.target.value);
                                  setTargetPrice(""); // Clear price when margin is set
                                }}
                                placeholder="Enter target margin"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedSKU(null);
                                setTargetMargin("");
                                setTargetPrice("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleApplyAdjustment}
                              disabled={!targetPrice && !targetMargin}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}