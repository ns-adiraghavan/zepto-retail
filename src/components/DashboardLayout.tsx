import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  const [selectedCity, setSelectedCity] = useState<string>("Bangalore");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All Platforms");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card shrink-0">
            <SidebarTrigger className="shrink-0" />
            <div className="h-4 w-px bg-border" />
            {/* Context Filters */}
            <div className="flex items-center gap-2 ml-auto">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Cities">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Platforms">All Platforms</SelectItem>
                  {platforms.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span>Live</span>
              </div>
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
