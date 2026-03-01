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
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const CURRENT_MONTH = new Date().getMonth() + 1; // 1-indexed
const CURRENT_YEAR = new Date().getFullYear();

function RevenueChart({ data, selectedYear, onYearChange, minYear }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2">
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-sm text-primary-600">
            ₱
            {payload[0].value.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (month) => {
    if (selectedYear < CURRENT_YEAR) return "#93c5fd";
    if (month === CURRENT_MONTH) return "#3b82f6";
    if (month < CURRENT_MONTH) return "#93c5fd";
    return "#e5e7eb";
  };

  const formatYAxis = (value) => {
    if (value >= 1000) return `₱${(value / 1000).toFixed(0)}k`;
    return `₱${value}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Monthly Revenue</h2>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              onClick={() => onYearChange((y) => y - 1)}
              disabled={selectedYear <= minYear}
              className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-700 w-12 text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => onYearChange((y) => y + 1)}
              disabled={selectedYear >= CURRENT_YEAR}
              className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.month} fill={getBarColor(entry.month)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
        {selectedYear === CURRENT_YEAR && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-primary-500"></span>
              Current month
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary-300"></span>
          Past months
        </span>
        {selectedYear === CURRENT_YEAR && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-gray-200"></span>
              Upcoming
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [availableYears, setAvailableYears] = useState([CURRENT_YEAR]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchData();
    fetchAvailableYears();
    fetchMonthlyRevenue(CURRENT_YEAR);
  }, [user, navigate]);

  useEffect(() => {
    if (user) fetchMonthlyRevenue(selectedYear);
  }, [selectedYear]);

  const fetchAvailableYears = async () => {
    try {
      const res = await API.get("/sales/analytics/years");
      const years =
        Array.isArray(res.data) && res.data.length > 0
          ? res.data
          : [CURRENT_YEAR];
      setAvailableYears(years);
    } catch (err) {
      console.error("Available years fetch error:", err);
    }
  };

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
        (it) => Number(it.quantity) <= LOW_STOCK_THRESHOLD,
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

  const fetchMonthlyRevenue = async (year = CURRENT_YEAR) => {
    setChartLoading(true);
    try {
      const res = await API.get(`/sales/analytics/monthly?year=${year}`);
      setMonthlyRevenue(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Monthly revenue fetch error:", err);
    } finally {
      setChartLoading(false);
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

        {/* Monthly Revenue Chart */}
        {chartLoading ? (
          <div className="bg-white rounded-2xl shadow-card p-6 flex items-center justify-center h-40">
            <LoadingSpinner size="medium" text="Loading chart..." />
          </div>
        ) : (
          <RevenueChart
            data={monthlyRevenue}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            minYear={
              availableYears.length > 0
                ? Math.min(...availableYears)
                : CURRENT_YEAR
            }
          />
        )}
      </main>
    </>
  );
}
