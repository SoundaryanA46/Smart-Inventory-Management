import { Link } from 'react-router-dom';
import { BarChart3, Package, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ui/ThemeToggle';
import logoImage from '@/assets/image.png';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logoImage}
              alt="Smart Inventory Logo"
              className="w-10 h-10 sm:w-14 sm:h-14 object-contain flex-shrink-0"
            />
            <span className="font-bold text-base sm:text-xl text-foreground truncate">
              Smart Inventory Management
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/signup">
              <Button size="sm" className="sm:h-10 sm:px-4">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
            Smart Inventory Management
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take control of your inventory with our powerful, easy-to-use platform. 
            Track products, manage stock levels, and optimize your supply chain.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
            <Link to="/signup">
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto">
                Let's Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
            <div className="p-6 rounded-lg border border-border">
              <div className="w-12 h-12 hero-gradient rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Real-time Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your inventory levels in real-time and get alerts when stock runs low.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border">
              <div className="w-12 h-12 hero-gradient rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Analytics & Reports</h3>
              <p className="text-muted-foreground">
                Get detailed insights into your inventory with comprehensive analytics and reports.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border">
              <div className="w-12 h-12 hero-gradient rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Easy to Use</h3>
              <p className="text-muted-foreground">
                Intuitive interface designed for teams of all sizes. Get started in minutes.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2026 Inventory Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
