import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  const selectedCity = "All Cities";
  const selectedPlatform = "All Platforms";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card shrink-0">
            <SidebarTrigger className="shrink-0" />
            <div className="h-4 w-px bg-border" />
            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span>Live</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet context={{ selectedCity, selectedPlatform }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
