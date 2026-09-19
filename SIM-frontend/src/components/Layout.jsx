import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  AlertTriangle,
  FileText,
  Users,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthService from '@/services/auth.service';
import logoImage from '@/assets/image.png';
import ThemeToggle from '@/components/ui/ThemeToggle';

/** Idle timeout: logout after this many ms without user activity (default 30 min). */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop expanded/collapsed
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const lastActivityRef = useRef(Date.now());
  const idleCheckRef = useRef(null);

  useEffect(() => {
    if (!AuthService.isSessionValid()) {
      navigate('/login', { replace: true });
      return;
    }
    setUser(AuthService.getCurrentUser());
  }, [navigate]);

  // Close mobile drawer when navigating
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetIdleTimer));
    idleCheckRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        AuthService.clearSession();
        window.clearInterval(idleCheckRef.current);
        navigate('/login', { replace: true });
      }
    }, 60 * 1000);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
      if (idleCheckRef.current) window.clearInterval(idleCheckRef.current);
    };
  }, [user, navigate, resetIdleTimer]);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };

  const isAdmin = user?.roles?.some(role => role === 'ROLE_ADMIN' || role.includes('ADMIN'));

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/transactions', icon: ShoppingCart, label: 'Transactions' },
    { path: '/alerts', icon: AlertTriangle, label: 'Low Stock Alerts' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    ...(isAdmin ? [{ path: '/ml-analytics', icon: FileText, label: 'ML Analytics' }] : []),
    ...(isAdmin ? [{ path: '/users', icon: Users, label: 'User Management' }] : []),
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-surface border-r border-border transition-all duration-300 flex-col shadow-sm`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <img
              src={logoImage}
              alt="Smart Inventory Logo"
              className="w-10 h-10 object-contain flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            {sidebarOpen && (
              <span className="font-bold text-lg text-foreground">Smart Inventory</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0 rounded-lg hover:bg-muted"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm dark:ring-1 dark:ring-primary/30'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'stroke-[1.5]'}`} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border">
          {sidebarOpen && (
            <div className="mb-3 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">{user.username}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAdmin ? 'Admin' : 'Employee'}
              </p>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 rounded-lg"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[18rem] max-w-[85vw] bg-surface border-r border-border shadow-xl flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-3">
                <img
                  src={logoImage}
                  alt="Smart Inventory Logo"
                  className="w-10 h-10 object-contain flex-shrink-0"
                />
                <span className="font-bold text-base text-foreground leading-tight">
                  Smart Inventory
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm dark:ring-1 dark:ring-primary/30'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 stroke-[1.5]" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border">
              <div className="mb-3 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{user.username}</p>
                <p className="text-xs text-muted-foreground break-all">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAdmin ? 'Admin' : 'Employee'}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 rounded-lg"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-4 md:px-6 shadow-sm">
          {/* Left: Page Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden rounded-lg hover:bg-muted"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-foreground">
                {menuItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
              </span>
              <span className="text-xs text-muted-foreground">
                Smart Inventory Management
              </span>
            </div>
          </div>

          {/* Right: Theme Toggle */}
          <ThemeToggle />
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
