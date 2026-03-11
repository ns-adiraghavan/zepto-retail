import { Button } from "@/components/ui/button";
import { BarChart3, Globe, ShoppingCart, TrendingUp, Moon, Sun } from "lucide-react";
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
            Quick-Commerce{" "}
            <span className="text-primary">Competitive Intelligence</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Real-time public data intelligence comparing Zepto, Blinkit, Swiggy Instamart,
            and BigBasket Now across India's top metro cities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild>
              <Link to="/dashboard">Open Dashboard</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/dashboard">Explore Intelligence</Link>
            </Button>
          </div>

          {/* Platform chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {["Zepto", "Blinkit", "Swiggy Instamart", "BigBasket Now"].map((p) => (
              <span
                key={p}
                className="px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium"
              >
                {p}
              </span>
            ))}
            <span className="text-muted-foreground text-sm">across</span>
            {["Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"].map((c) => (
              <span
                key={c}
                className="px-4 py-1.5 rounded-full border border-border bg-muted text-sm font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6 mx-auto">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Pricing & Promo Tracking</h3>
            <p className="text-muted-foreground">
              Monitor price movements, discounts, and promotional strategies across all four platforms in real time.
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6 mx-auto">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Assortment & Availability</h3>
            <p className="text-muted-foreground">
              Track SKU breadth, exclusive listings, stockout events, and fill rates across platforms.
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6 mx-auto">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Local Market Intelligence</h3>
            <p className="text-muted-foreground">
              City-level intelligence with hyper-local promotions, regional price gaps, and market share signals.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to unlock quick-commerce intelligence?
          </h2>
          <Button size="lg" asChild>
            <Link to="/dashboard">Open Dashboard</Link>
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
              © 2024 Insightly.ai. Public data competitive intelligence.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
