import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Tag,
  Search,
  Package,
  CheckCircle2,
  MapPin,
  BarChart3,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Competitive Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Pricing & Promotions",
    url: "/dashboard/pricing",
    icon: Tag,
  },
  {
    title: "Search & Shelf Visibility",
    url: "/dashboard/search",
    icon: Search,
  },
  {
    title: "Assortment Intelligence",
    url: "/dashboard/assortment",
    icon: Package,
  },
  {
    title: "Availability Intelligence",
    url: "/dashboard/availability",
    icon: CheckCircle2,
  },
  {
    title: "Local Market Intelligence",
    url: "/dashboard/local",
    icon: MapPin,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isActive = (url: string) => {
    if (url === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      {/* Logo / Brand */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary shrink-0">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold truncate">Insightly.ai</div>
              <div className="text-xs text-muted-foreground truncate">Quick-commerce Intel</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Intelligence Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center gap-2",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 shrink-0" />
            ) : (
              <Moon className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && (
              <span className="text-xs">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </Button>
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Live Data</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
