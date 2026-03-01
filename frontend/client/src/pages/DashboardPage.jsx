import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../contexts/AuthContext";
import StatsCard from "../components/StatsCard";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);

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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <>
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
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
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

      </main>
    </>
  );
}
