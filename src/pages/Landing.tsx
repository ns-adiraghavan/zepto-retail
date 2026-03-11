import { Button } from "@/components/ui/button";
import { BarChart3, Target, TrendingUp, Zap, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";

const Landing = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-primary">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h1 className="text-xl lg:text-2xl font-bold">Insightly.ai</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 mr-2" />
              ) : (
                <Moon className="h-4 w-4 mr-2" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Turn Pricing Complexity into{" "}
            <span className="text-primary">Clarity</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Real-time retail pricing intelligence powered by AI. Optimize margins, 
            track competitors, and respond to demand shifts with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild>
              <Link to="/dashboard">See the Demo</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/dashboard">Get Started</Link>
            </Button>
          </div>
          
          {/* Dashboard Preview */}
          <Link to="/dashboard" className="block">
            <div className="bg-card border border-border rounded-lg p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group">
              {/* Mock Dashboard Layout */}
              <div className="space-y-4">
                {/* Header Bar - More detailed */}
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-14 w-full flex items-center px-4 gap-4">
                  <div className="w-8 h-8 bg-primary/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="w-24 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-40 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* KPI Cards Row - More detailed */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20 p-3 space-y-2">
                    <div className="w-16 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-12 h-4 bg-primary/30 rounded font-bold"></div>
                    <div className="w-8 h-2 bg-green-400/60 rounded"></div>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20 p-3 space-y-2">
                    <div className="w-20 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-14 h-4 bg-primary/30 rounded font-bold"></div>
                    <div className="w-6 h-2 bg-red-400/60 rounded"></div>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20 p-3 space-y-2">
                    <div className="w-18 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-10 h-4 bg-primary/30 rounded font-bold"></div>
                    <div className="w-10 h-2 bg-blue-400/60 rounded"></div>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20 p-3 space-y-2">
                    <div className="w-16 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-12 h-4 bg-primary/30 rounded font-bold"></div>
                    <div className="w-8 h-2 bg-yellow-400/60 rounded"></div>
                  </div>
                </div>
                
                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Price Heatmap - Takes up 2 columns */}
                  <div className="lg:col-span-2 bg-gray-200 dark:bg-gray-700 rounded-lg h-48 lg:h-56 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-24 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="w-16 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                    <div className="grid grid-cols-8 gap-1 h-32">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className={`rounded-sm ${
                          i % 5 === 0 ? 'bg-red-400/60' : 
                          i % 3 === 0 ? 'bg-yellow-400/60' : 
                          'bg-green-400/60'
                        }`}></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right Column - Alerts and Quick Actions */}
                  <div className="lg:col-span-1 space-y-4">
                    {/* Alerts Panel */}
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-28 p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                        <div className="w-20 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="w-3/4 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="w-1/2 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24 p-3">
                      <div className="w-24 h-3 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="w-full h-6 bg-primary/30 rounded"></div>
                        <div className="w-full h-6 bg-primary/30 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Grid - High-Risk SKUs and Category Rollup */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 p-3">
                    <div className="flex justify-between items-center mb-3">
                      <div className="w-28 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="w-12 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="w-16 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="w-12 h-2 bg-red-400/60 rounded"></div>
                        <div className="w-8 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-20 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="w-10 h-2 bg-yellow-400/60 rounded"></div>
                        <div className="w-6 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-14 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="w-8 h-2 bg-red-400/60 rounded"></div>
                        <div className="w-10 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 p-3">
                    <div className="flex justify-between items-center mb-3">
                      <div className="w-32 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="w-10 h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 h-16">
                      <div className="bg-green-400/40 rounded p-2">
                        <div className="w-full h-2 bg-green-600/60 rounded mb-1"></div>
                        <div className="w-3/4 h-1 bg-green-600/60 rounded"></div>
                      </div>
                      <div className="bg-yellow-400/40 rounded p-2">
                        <div className="w-full h-2 bg-yellow-600/60 rounded mb-1"></div>
                        <div className="w-2/3 h-1 bg-yellow-600/60 rounded"></div>
                      </div>
                      <div className="bg-red-400/40 rounded p-2">
                        <div className="w-full h-2 bg-red-600/60 rounded mb-1"></div>
                        <div className="w-1/2 h-1 bg-red-600/60 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          
          {/* View Live Dashboard Link */}
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                View Live Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6 mx-auto">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">SKU-Level Intelligence</h3>
            <p className="text-muted-foreground">
              Analyze risk, performance, and competitor moves at the product level.
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6 mx-auto">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Dynamic Adjustments</h3>
            <p className="text-muted-foreground">
              Test pricing, margins, and promotions with instant impact previews.
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6 mx-auto">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Market Awareness</h3>
            <p className="text-muted-foreground">
              Track competitor activity, pincode variations, and promotions in real time.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to unlock pricing intelligence?
          </h2>
          <Button size="lg">
            Request a Demo
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-primary">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              © 2024 Insightly.ai. Professional pricing intelligence.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;