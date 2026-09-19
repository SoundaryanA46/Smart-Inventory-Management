import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertTriangle, Package, ArrowRight, Bell, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import AuthService from "@/services/auth.service";
import AlertService from "@/services/alert.service";
import NotificationService from "@/services/notification.service";
import UserService from "@/services/user.service";

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const addUser = (user) => {
    if (selectedUsers.some((u) => u.id === user.id)) return;
    setSelectedUsers([...selectedUsers, user]);
    setSearchTerm("");
  };

  const removeUser = (id) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== id));
  };

  const loadAlerts = async () => {
    try {
      const response = await AlertService.getLowStock();
      setAlerts(response.data?.products || []);
    } catch (error) {
      console.error("Error loading alerts", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const res = await NotificationService.getSettings();
      setEmailEnabled(res.data.emailAlertEnabled);
      setSelectedUsers(res.data.alertUsers || []);
    } catch (err) {
      console.error("Failed to load notification settings", err);
    }
  };

  const saveSettings = async () => {
  try {
    await NotificationService.updateSettings({
  emailAlertEnabled: emailEnabled,
  alertEmails: selectedUsers.map((u) => u.email),
});

    alert("Alert users updated successfully");
  } catch (err) {
    alert("Failed to save alert users");
  }
};


  const toggleEmailAlert = async (enabled) => {
    try {
      setEmailEnabled(enabled); // instant UI update
      await NotificationService.updateSettings({
        emailAlertEnabled: enabled,
        alertEmails: selectedUsers.map((u) => u.email),
      });
    } catch (err) {
      alert("Failed to update notification status");
      setEmailEnabled(!enabled); // rollback
    }
  };


  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const init = async () => {
      const currentUser = AuthService.getCurrentUser();

      // 🔐 login check
      if (!currentUser || !currentUser.token) {
        navigate("/login");
        return;
      }

      // ✅ role check
      const admin = currentUser.roles?.includes("ROLE_ADMIN");
      setIsAdmin(admin);

      // 📦 load alerts & notification settings
      await loadAlerts();
      await loadNotificationSettings();

      // 👤 load users ONLY for admin
      if (admin) {
        try {
          const res = await UserService.getAll();
          setUsers(res.data || []);
        } catch (err) {
          console.error("Failed to load users", err);
        }
      }
    };

    init();
  }, [navigate]);


  const getStockStatus = (current, minimum) => {
    const percentage = (current / minimum) * 100;
    if (percentage <= 50)
      return { label: "Critical", variant: "danger" };
    if (percentage <= 75)
      return { label: "Low", variant: "warning" };
    return { label: "Warning", variant: "warning" };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
            <p className="text-muted-foreground">
              Products that need immediate attention
            </p>
          </div>
          <Button variant="outline" onClick={loadAlerts}>
            Refresh
          </Button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Total Alerts
              </h3>
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{alerts.length}</p>
            <p className="text-xs text-muted-foreground">Products requiring attention</p>
          </div>

          <div className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Critical
              </h3>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-destructive mb-1">
              {alerts.filter(
                (p) => (p.currentStock / p.minimumStock) * 100 <= 50
              ).length}
            </p>
            <p className="text-xs text-muted-foreground">Below 50% of minimum</p>
          </div>

          <div className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Low Stock
              </h3>
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
              {alerts.filter((p) => {
                const percent = (p.currentStock / p.minimumStock) * 100;
                return percent > 50 && percent <= 75;
              }).length}
            </p>
            <p className="text-xs text-muted-foreground">50-75% of minimum</p>
          </div>
        </div>

        {/* ALERTS LIST */}
        {alerts.length === 0 ? (
          <div className="border border-border rounded-2xl p-12 text-center bg-surface">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-base font-medium text-foreground mb-1">No low stock products</p>
            <p className="text-sm text-muted-foreground">All products are above their minimum stock levels.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((product) => {
              const status = getStockStatus(
                product.currentStock,
                product.minimumStock
              );
              const percent = (
                (product.currentStock / product.minimumStock) *
                100
              ).toFixed(0);

              return (
                <div
                  key={product.id}
                  className="card-premium"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-foreground mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                    </div>

                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Current Stock:</span>
                      <span className="font-medium text-foreground">{product.currentStock} {product.unit}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Minimum Stock:</span>
                      <span className="font-medium text-foreground">{product.minimumStock} {product.unit}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Stock Level:</span>
                      <span className={`font-semibold ${status.variant === 'danger' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}`}>
                        {percent}% of minimum
                      </span>
                    </div>
                  </div>

                  <Link to="/products">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      View Product <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* ADMIN EMAIL SETTINGS */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* TOGGLE */}
            <div className={`card-premium ${emailEnabled ? 'ring-2 ring-green-500/20' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${emailEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                  <Bell className={`w-5 h-5 ${emailEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Email Alert Notification</h2>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Enable Low Stock Email Alerts</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => toggleEmailAlert(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {/* EMAIL MANAGEMENT */}
            <div className="card-premium">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Alert Email Management</h2>
              </div>

              {!emailEnabled && (
                <p className="text-sm text-muted-foreground">
                  Enable email alerts to manage email recipients
                </p>
              )}

             {emailEnabled && (
  <>
    <label className="block mb-2 text-sm font-medium text-foreground">
      Search & Select Users
    </label>

    <Input
      type="text"
      placeholder="Search user by name or email..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full mb-2"
    />

{searchTerm && (
  <div className="border border-border rounded-lg max-h-40 overflow-y-auto bg-surface mb-3">
    {filteredUsers.length === 0 && (
      <p className="text-sm p-3 text-muted-foreground">No user found</p>
    )}

    {filteredUsers.map(user => (
      <div
        key={user.id}
        className="p-2 cursor-pointer hover:bg-muted transition-colors text-sm text-foreground"
        onClick={() => addUser(user)}
      >
        {user.username} ({user.email})
      </div>
    ))}
  </div>
)}


    {selectedUsers.length > 0 && (
  <div className="mt-3 mb-4">
    <p className="font-medium mb-2 text-sm text-foreground">Selected Users</p>

    <div className="space-y-2">
      {selectedUsers.map(user => (
        <div
          key={user.id}
          className="flex justify-between items-center border border-border rounded-lg p-2 bg-surface"
        >
          <span className="text-sm text-foreground">{user.username} ({user.email})</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeUser(user.id)}
            className="h-6 w-6 p-0 rounded-lg"
          >
            <X className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  </div>
)}

    <Button className="w-full" onClick={saveSettings}>
      Save Alert Users
    </Button>
  </>
)}

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
