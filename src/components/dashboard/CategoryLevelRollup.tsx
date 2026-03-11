import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryRollupData } from "@/data/dashboardData";

export const CategoryLevelRollup = () => {
  const getElasticityColor = (score: number) => {
    if (score > 7) return "text-green-600";
    if (score >= 4) return "text-yellow-600";
    return "text-gray-600";
  };

  const getPromoResponseColor = (response: string) => {
    switch (response) {
      case "High": return "text-green-600";
      case "Medium": return "text-yellow-600";
      case "Low": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case "Critical":
      case "High":
        return "destructive";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category-Level Rollup</CardTitle>
        <CardDescription>
          Portfolio-level view of elasticity, promotion responsiveness, and risk across categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Category</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Avg Elasticity</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Promo Response</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Avg Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {categoryRollupData.map((category) => (
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