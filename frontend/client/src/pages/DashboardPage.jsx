// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import LogoutButton from "../components/LogoutButton";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const navigate = useNavigate();

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    const token = localStorage.getItem("sarinya_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, []);

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
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-10 text-base">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <LogoutButton />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="text-gray-500 text-sm">Total Inventory Items</div>
          <div className="text-3xl font-bold mt-2">{inventoryCount}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="text-gray-500 text-sm">
            Low Stock Items (≤ {LOW_STOCK_THRESHOLD})
          </div>
          <div className="text-3xl font-bold mt-2">{lowStockCount}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="text-gray-500 text-sm">Total Sales</div>
          <div className="text-3xl font-bold mt-2">{salesCount}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="text-gray-500 text-sm">Total Revenue</div>
          <div className="text-3xl font-bold mt-2">
            ₱{totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventory"
            className="px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            View Inventory
          </Link>

          <Link
            to="/sales"
            className="px-5 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            View Sales
          </Link>

          <button
            onClick={fetchData}
            className="px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
