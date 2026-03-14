import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import API from "../api";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";
import TableSkeleton from "../components/TableSkeleton";
import {
  Trash2,
  ShoppingCart,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  BarChart2,
  X,
  PieChart as PieChartIcon,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

// ── Constants ────────────────────────────────────────────────────────────────
const TOP_N = 7;
const PIE_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#64748b", // slate
  "#9ca3af", // gray — "Others"
];

// ── Pure helper ───────────────────────────────────────────────────────────────
function buildPieData(sales, metric) {
  if (!sales.length) return [];

  const sorted = [...sales].sort((a, b) =>
    metric === "revenue" ? b.total - a.total : b.quantity - a.quantity
  );

  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const othersValue = rest.reduce(
    (sum, s) => sum + (metric === "revenue" ? s.total : s.quantity),
    0
  );

  const result = top.map((s, i) => ({
    name: s.productName,
    value: metric === "revenue" ? s.total : s.quantity,
    color: PIE_COLORS[i],
  }));

  if (othersValue > 0) {
    result.push({ name: "Others", value: othersValue, color: PIE_COLORS[7] });
  }

  return result;
}

// ── BestSellersPieChart sub-component ────────────────────────────────────────
function BestSellersPieChart({ data, metric, onMetricChange, loading }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0].payload;
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-800 mb-0.5">{name}</p>
        <p className="text-gray-600">
          {metric === "revenue" ? `₱${value.toLocaleString()}` : `${value.toLocaleString()} units`}
        </p>
        <p className="text-gray-400 text-xs">{pct}% of total</p>
      </div>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-48 h-48 rounded-full border-[24px] border-gray-200 animate-pulse" />
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <PieChartIcon className="w-12 h-12 mb-3 text-gray-300" />
        <p className="font-medium text-gray-500">No data for this period</p>
        <p className="text-sm mt-1">Try selecting a different time range</p>
      </div>
    );
  }

  return (
    <div>
      {/* Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={600}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Donut center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-gray-400 font-medium">Total</p>
          <p className="text-base font-bold text-gray-800">
            {metric === "revenue"
              ? `₱${total.toLocaleString()}`
              : `${total.toLocaleString()}`}
          </p>
          {metric === "quantity" && (
            <p className="text-xs text-gray-400">units</p>
          )}
        </div>
      </div>

      {/* Custom Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
        {data.map((entry, i) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={i} className="flex items-center gap-1.5 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 max-w-[120px] truncate" title={entry.name}>
                {entry.name}
              </span>
              <span className="text-gray-400 text-xs">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function SalesPage() {
  const location = useLocation();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState(location.state?.timeRange ?? "daily");
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState("products"); // "transactions" | "products"
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [chartMetric, setChartMetric] = useState("revenue");
  const { hasPermission } = useAuth();

  const loadSales = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (search) params.search = search;
        params.timeRange = timeRange;
        if (selectedDate) params.date = selectedDate;
        if (viewMode === "products") params.grouped = "true";

        const res = await API.get("/sales", { params });
        setSales(res.data.sales);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
      } catch (error) {
        console.log("Error loading sales:", error);
      } finally {
        setLoading(false);
      }
    },
    [search, timeRange, selectedDate, viewMode]
  );

  useEffect(() => {
    loadSales(1);
  }, [loadSales]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const overallTotal = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);

  const handleDeleteSale = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) return;

    setDeletingId(id);
    try {
      await API.delete(`/sales/${id}`);
      loadSales(1);
    } catch (error) {
      console.log("Delete sale failed:", error);
      alert("Failed to delete sale");
    } finally {
      setDeletingId(null);
    }
  };

  // Derived pie data — O(n), no memo needed
  const pieData = viewMode === "products" ? buildPieData(sales, chartMetric) : [];

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-700 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sales</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {viewMode === "products"
                    ? `${sales.length} products sold`
                    : `${pagination.total} transactions`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Revenue Summary Card */}
        <div className="card p-6 mb-6 bg-gradient-to-r from-success-500 to-success-600 text-white animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm font-medium">
                {{ all: "Total", daily: "Today's", weekly: "This Week's", monthly: "This Month's", yearly: "This Year's" }[timeRange] || timeRange} Revenue
              </p>
              <p className="text-3xl sm:text-4xl font-bold mt-1">₱{overallTotal.toLocaleString()}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-4 mb-6 sticky top-16 z-10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Time Range Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto min-w-0 scrollbar-hide">
                <Filter className="w-5 h-5 text-gray-400 hidden md:block" />

                {/* Date Picker */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (e.target.value) setTimeRange("custom");
                  }}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm text-gray-600"
                />

                {["daily", "weekly", "monthly", "yearly"].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setSelectedDate("");
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap ${
                      timeRange === range
                        ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("products")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === "products"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  By Product
                </button>
                <button
                  onClick={() => setViewMode("transactions")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === "transactions"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                  Transactions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Best Sellers Pie Chart — only in "By Product" mode */}
        {viewMode === "products" && (
          <div className="card p-6 mb-6 animate-fade-in">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}
                >
                  <PieChartIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Best Sellers</h2>
                  <p className="text-xs text-gray-500">Top {TOP_N} products for this period</p>
                </div>
              </div>

              {/* Metric Toggle */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setChartMetric("revenue")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    chartMetric === "revenue"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  By Revenue (₱)
                </button>
                <button
                  onClick={() => setChartMetric("quantity")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    chartMetric === "quantity"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  By Quantity
                </button>
              </div>
            </div>

            <BestSellersPieChart
              data={pieData}
              metric={chartMetric}
              onMetricChange={setChartMetric}
              loading={loading}
            />
          </div>
        )}

        {/* Sales Table Card */}
        <div className="card overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900">
              {viewMode === "products" ? "Sales by Product" : "Sales History"}
            </h2>
          </div>

          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} columns={viewMode === "products" ? 3 : 5} />
            </div>
          ) : viewMode === "products" ? (
            /* ── BY PRODUCT VIEW ── */
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total Qty Sold
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{sale.productName}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{sale.quantity}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-success-100 text-success-800">
                          ₱{sale.total.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {sales.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No sales recorded yet</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Sales are recorded from the Take Order or Stocks page
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── TRANSACTIONS VIEW ── */
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{sale.product?.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{sale.quantity}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-success-100 text-success-800">
                          ₱{sale.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {(() => {
                            const d = new Date(sale.date);
                            const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                            const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                            return `${date} · ${time}`;
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {sales.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No sales recorded yet</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Sales are recorded from the Take Order or Stocks page
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination (transactions mode only) */}
          {viewMode === "transactions" && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="small"
                  icon={ChevronLeft}
                  onClick={() => loadSales(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => loadSales(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
