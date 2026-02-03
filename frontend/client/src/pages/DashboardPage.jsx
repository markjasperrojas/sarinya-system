import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../contexts/AuthContext";
import LogoutButton from "../components/LogoutButton";
import StatsCard from "../components/StatsCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  RefreshCw,
  LayoutDashboard,
  Shield,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, hasPermission } = useAuth();

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [invRes, salesRes] = await Promise.all([
        API.get("/inventory"),
        API.get("/sales"),
      ]);

      const items = Array.isArray(invRes.data) ? invRes.data : [];
      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];

      setInventoryCount(items.length);

      const low = items.filter(
        (it) => Number(it.quantity) <= LOW_STOCK_THRESHOLD
      ).length;
      setLowStockCount(low);

      setSalesCount(sales.length);

      const revenue = sales.reduce((acc, s) => {
        const saleTotal =
          s.total ?? (Number(s.price) * Number(s.quantity) || 0);
        return acc + Number(saleTotal);
      }, 0);

      setTotalRevenue(revenue);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Sarinya Restaurant
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-fade-in">
          <StatsCard
            title="Total Inventory Items"
            value={inventoryCount}
            icon={Package}
            colorScheme="primary"
          />

          <StatsCard
            title={`Low Stock (≤ ${LOW_STOCK_THRESHOLD})`}
            value={lowStockCount}
            icon={AlertTriangle}
            colorScheme={lowStockCount > 0 ? "warning" : "success"}
          />

          <StatsCard
            title="Total Sales"
            value={salesCount}
            icon={ShoppingCart}
            colorScheme="success"
          />

          <StatsCard
            title="Total Revenue"
            value={totalRevenue}
            icon={DollarSign}
            colorScheme="success"
            prefix="₱"
          />
        </div>

        {/* Quick Actions */}
        <div className="card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-3">
            {isAdmin() && (
              <Link to="/admin">
                <Button variant="warning" icon={Shield}>
                  Admin Dashboard
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}

            {hasPermission("inventory", "view") && (
              <Link to="/inventory">
                <Button icon={Package}>
                  View Inventory
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}

            {hasPermission("sales", "view") && (
              <Link to="/sales">
                <Button variant="success" icon={ShoppingCart}>
                  View Sales
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => fetchData(true)}
              loading={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
