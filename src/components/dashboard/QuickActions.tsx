import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Users, Globe, BarChart3, Settings, Download } from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    label: "SKU Analysis",
    icon: Package,
    href: "/sku-analysis",
    description: "Detailed product-level pricing insights"
  },
  {
    label: "Competitor View",
    icon: Users,
    href: "/competitors",
    description: "Competitor pricing strategies & trends"
  },
  {
    label: "Regional Analysis",
    icon: Globe,
    href: "/regions",
    description: "Geographic pricing variations"
  },
  {
    label: "Reports",
    icon: BarChart3,
    href: "/reports",
    description: "Custom reports & analytics"
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    description: "Configure alerts & preferences"
  },
  {
    label: "Export Data",
    icon: Download,
    href: "/export",
    description: "Download pricing data & insights"
  }
];

export function QuickActions() {
  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors group relative"
              onClick={() => {
                // In a real app, this would navigate to the appropriate page
                console.log(`Navigate to ${action.href}`);
              }}
            >
              <action.icon className="h-6 w-6 text-primary" />
              <div className="text-center">
                <div className="font-medium text-sm">{action.label}</div>
              </div>
              {/* Hover tooltip */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap pointer-events-none">
                {action.description}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}