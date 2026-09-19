import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, TrendingUp, Users, ShoppingCart, Plus, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import AuthService from '@/services/auth.service';
import ProductService from '@/services/product.service';
import AlertService from '@/services/alert.service';
import TransactionService from '@/services/transaction.service';
import UserService from '@/services/user.service';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalTransactions: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    loadStats(currentUser);
  }, []);

  const loadStats = async (currentUser) => {
    try {
      const isAdmin = currentUser?.roles?.some(role => role === 'ROLE_ADMIN' || role.includes('ADMIN'));
      
      const promises = [
        ProductService.getAll().catch(() => ({ data: [] })),
        AlertService.getLowStock().catch(() => ({ data: { count: 0 } })),
        TransactionService.getAll().catch(() => ({ data: [] })),
      ];

      // Only fetch users if admin
      if (isAdmin) {
        promises.push(UserService.getAll().catch(() => ({ data: [] })));
      }

      const results = await Promise.all(promises);
      const [productsRes, alertsRes, transactionsRes, usersRes] = results;

      setStats({
        totalProducts: productsRes.data?.length || 0,
        lowStockItems: alertsRes.data?.count || 0,
        totalTransactions: transactionsRes.data?.length || 0,
        totalUsers: isAdmin ? (usersRes?.data?.length || 0) : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const isAdmin = user?.roles?.some(role => role === 'ROLE_ADMIN' || role.includes('ADMIN'));

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your inventory management system</p>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
          <div className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Products</h3>
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{stats.totalProducts}</p>
            <p className="text-xs text-muted-foreground">Active products</p>
          </div>

          <div className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Low Stock Items</h3>
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingUp className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{stats.lowStockItems}</p>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockItems === 0 ? 'All items in stock' : 'Need attention'}
            </p>
          </div>

          <div className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Transactions</h3>
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{stats.totalTransactions}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>

          {isAdmin && (
            <div className="card-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Users</h3>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Active users</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-premium">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {isAdmin && (
                <Link to="/products">
                  <Button className="w-full" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Product
                  </Button>
                </Link>
              )}
              <Link to="/products">
                <Button className="w-full" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View All Products
                </Button>
              </Link>
              <Link to="/reports">
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </Link>
            </div>
          </div>

          <div className="card-premium">
            <h2 className="text-xl font-semibold text-foreground mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Username</p>
                <p className="text-base font-medium text-foreground">{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="text-base font-medium text-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Role</p>
                <p className="text-base font-medium text-foreground">
                  {isAdmin ? 'Administrator' : 'Employee'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
