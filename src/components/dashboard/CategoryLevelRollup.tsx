import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { platformCategoryRollup } from "@/data/platformData";

export const CategoryLevelRollup = () => {
  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case "Critical":
      case "High":
        return "destructive" as const;
      case "Medium":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const getElasticityColor = (score: number) => {
    if (score > 7) return "text-status-low";
    if (score >= 4) return "text-status-medium";
    return "text-muted-foreground";
  };

  const getPromoResponseColor = (response: string) => {
    switch (response) {
      case "High": return "text-status-low";
      case "Medium": return "text-status-medium";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Intelligence Rollup</CardTitle>
        <CardDescription>
          Demand sensitivity, promo responsiveness, and competitive risk across categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Category</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Demand Index</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Promo Response</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {platformCategoryRollup.map((category) => (
                <tr key={category.name} className="border-b border-border last:border-b-0">
                  <td className="py-3 px-2 font-medium">{category.name}</td>
                  <td className="py-3 px-2">
                    <span className={`font-semibold ${getElasticityColor(category.avgElasticity)}`}>
                      {category.avgElasticity.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-sm font-medium ${getPromoResponseColor(category.promoResponse)}`}>
                      {category.promoResponse}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={getRiskVariant(category.avgRiskLevel)} className="text-xs">
                      {category.avgRiskLevel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
