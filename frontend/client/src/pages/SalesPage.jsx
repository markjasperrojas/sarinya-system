import { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";
import TableSkeleton from "../components/TableSkeleton";
import {
  Trash2,
  ArrowLeft,
  ShoppingCart,
  Calendar,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const { hasPermission } = useAuth();

  const loadSales = async () => {
    setLoading(true);
    try {
      // Only filter by timeRange on server
      const res = await API.get("/sales", {
        params: {
          timeRange: timeRange === "all" ? undefined : timeRange,
          date: selectedDate || undefined,
        },
      });
      setSales(res.data);
    } catch (error) {
      console.log("Error loading sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [timeRange, selectedDate]); // Reload when timeRange or selectedDate changes

  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Client-side filtering for real-time search
  const filteredSales = sales.filter((sale) =>
    sale.itemName.toLowerCase().includes(search.toLowerCase())
  );

  const overallTotal = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  const handleDeleteSale = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) return;

    setDeletingId(id);
    try {
      await API.delete(`/sales/${id}`);
      loadSales();
    } catch (error) {
      console.log("Delete sale failed:", error);
      alert("Failed to delete sale");
    } finally {
      setDeletingId(null);
    }
  };

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
                  {filteredSales.length} transactions
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
                Total Revenue
              </p>
              <p className="text-3xl sm:text-4xl font-bold mt-1">
                ₱{overallTotal.toLocaleString()}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </form>

            {/* Time Range Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto custom-scrollbar">
              <Filter className="w-5 h-5 text-gray-400 hidden md:block" />
              
              {/* Date Picker */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) setTimeRange("custom"); // Disable presets
                }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm text-gray-600"
              />

              {["all", "daily", "weekly", "monthly", "yearly"].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setSelectedDate(""); // Clear date when preset is clicked
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
        </div>

        {/* Sales Table Card */}
        <div className="card overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900">Sales History</h2>
          </div>

          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} columns={5} />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Item
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
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {sale.itemName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {sale.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-success-100 text-success-800">
                          ₱{sale.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {new Date(sale.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasPermission("sales", "delete") && (
                          <Button
                            variant="danger"
                            size="small"
                            icon={Trash2}
                            onClick={() => handleDeleteSale(sale._id)}
                            loading={deletingId === sale._id}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredSales.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          No sales recorded yet
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Sales are recorded from the Inventory page
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 mt-6 text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </main>
    </>
  );
}
