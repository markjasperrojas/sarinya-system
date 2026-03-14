import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../contexts/AuthContext";
import StatsCard from "../components/StatsCard";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Package,
  AlertTriangle,
  Banknote,
  LayoutDashboard,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CalendarX,
  CalendarClock,
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
const CURRENT_DAY = new Date().getDate();
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function RevenueChart({ data, selectedYear, onYearChange, minYear, selectedMonth, onMonthChange }) {
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

  const isCurrentPeriod = selectedYear === CURRENT_YEAR && selectedMonth === CURRENT_MONTH;

  const getBarColor = (day) => {
    if (!isCurrentPeriod) return "#93c5fd";
    if (day === CURRENT_DAY) return "#3b82f6";
    if (day < CURRENT_DAY) return "#93c5fd";
    return "#e5e7eb";
  };

  const formatYAxis = (value) => {
    if (value >= 1000) return `₱${(value / 1000).toFixed(0)}k`;
    return `₱${value}`;
  };

  const monthRightDisabled = selectedYear === CURRENT_YEAR && selectedMonth >= CURRENT_MONTH;
  const monthLeftDisabled = selectedMonth <= 1;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Daily Revenue</h2>
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
            <span className="mx-1 text-gray-300">|</span>
            <button
              onClick={() => onMonthChange((m) => m - 1)}
              disabled={monthLeftDisabled}
              className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-700 w-8 text-center">
              {MONTH_LABELS[selectedMonth - 1]}
            </span>
            <button
              onClick={() => onMonthChange((m) => m + 1)}
              disabled={monthRightDisabled}
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
              <Cell key={entry.day} fill={getBarColor(entry.day)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
        {isCurrentPeriod && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-primary-500"></span>
              Today
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary-300"></span>
          Past days
        </span>
        {isCurrentPeriod && (
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
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [availableYears, setAvailableYears] = useState([CURRENT_YEAR]);
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
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
  }, [user, navigate]);

  useEffect(() => {
    if (user) fetchDailyRevenue(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

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
      const [invRes, salesRes, productsRes] = await Promise.all([
        API.get("/inventory"),
        API.get("/sales", { params: { timeRange: "monthly" } }),
        API.get("/products"),
      ]);

      const items = Array.isArray(invRes.data) ? invRes.data : [];
      const activeItems = items.filter((it) => Number(it.quantity) > 0);
      const sales = Array.isArray(salesRes.data?.sales) ? salesRes.data.sales : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];

      setProductCount(products.length);

      const low = activeItems.filter(
        (it) => Number(it.quantity) <= LOW_STOCK_THRESHOLD,
      ).length;
      setLowStockCount(low);

      const revenue = sales.reduce((acc, s) => acc + Number(s.total), 0);

      setTotalRevenue(revenue);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const EXPIRY_WARNING_DAYS = 7;

      const expiring = activeItems
        .filter((it) => it.expirationDate)
        .map((it) => {
          const exp = new Date(it.expirationDate);
          exp.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
          return { ...it, diffDays };
        })
        .filter((it) => it.diffDays <= EXPIRY_WARNING_DAYS)
        .sort((a, b) => a.diffDays - b.diffDays);

      setExpiredCount(expiring.filter((it) => it.diffDays < 0).length);
      setExpiringSoonCount(expiring.filter((it) => it.diffDays >= 0).length);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyRevenue = async (year = CURRENT_YEAR, month = CURRENT_MONTH) => {
    setChartLoading(true);
    try {
      const res = await API.get(`/sales/analytics/daily?year=${year}&month=${month}`);
      setMonthlyRevenue(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Daily revenue fetch error:", err);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 animate-fade-in">
          <StatsCard
            title="Total Products"
            value={productCount}
            icon={Package}
            colorScheme="primary"
            onClick={() => navigate("/products")}
          />

          <StatsCard
            title={`Low Stock (≤ ${LOW_STOCK_THRESHOLD})`}
            value={lowStockCount}
            icon={AlertTriangle}
            colorScheme={lowStockCount > 0 ? "warning" : "success"}
            onClick={() => navigate("/inventory?sort=quantity&dir=asc")}
          />

          <StatsCard
            title="Monthly Revenue"
            value={totalRevenue}
            icon={Banknote}
            colorScheme="success"
            prefix="₱"
            onClick={() => navigate("/sales", { state: { timeRange: "monthly" } })}
          />
        </div>

        {/* Expiration Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 animate-fade-in">
          <StatsCard
            title="Expired Items"
            value={expiredCount}
            icon={CalendarX}
            colorScheme={expiredCount > 0 ? "danger" : "success"}
            onClick={() => navigate("/inventory?sort=expirationDate&dir=asc")}
          />
          <StatsCard
            title="Expiring Soon (≤ 7 days)"
            value={expiringSoonCount}
            icon={CalendarClock}
            colorScheme={expiringSoonCount > 0 ? "warning" : "success"}
            onClick={() => navigate("/inventory?sort=expirationDate&dir=asc")}
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
            onYearChange={(updater) => {
              setSelectedYear((prev) => {
                const next = typeof updater === "function" ? updater(prev) : updater;
                if (next === CURRENT_YEAR && selectedMonth > CURRENT_MONTH) {
                  setSelectedMonth(CURRENT_MONTH);
                }
                return next;
              });
            }}
            minYear={
              availableYears.length > 0
                ? Math.min(...availableYears)
                : CURRENT_YEAR
            }
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}

      </main>
    </>
  );
}
