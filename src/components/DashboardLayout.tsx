import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Layers } from "lucide-react";

const CITIES = ["All Cities", "Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];
const PLATFORMS = ["All Platforms", "Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"];

export function DashboardLayout() {
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedPlatform, setSelectedPlatform] = useState("All Platforms");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card shrink-0">
            <SidebarTrigger className="shrink-0" />
            <div className="h-4 w-px bg-border" />

            {/* Global filters */}
            <div className="flex items-center gap-2">
              {/* City selector */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[130px] focus:ring-1 hover:bg-muted/70 transition-colors">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city} className="text-xs">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Platform selector */}
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="h-8 gap-1.5 rounded-full border border-border bg-muted/40 px-3 text-xs font-medium w-auto min-w-[150px] focus:ring-1 hover:bg-muted/70 transition-colors">
                  <Layers className="h-3 w-3 text-muted-foreground shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform} value={platform} className="text-xs">
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
