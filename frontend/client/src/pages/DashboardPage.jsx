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

  // threshold for low stock (adjust as needed)
  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    // simple guard: if not logged in, go to login
    const token = localStorage.getItem("sarinya_token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel requests for speed
      const [invRes, salesRes] = await Promise.all([
        API.get("/inventory"),
        API.get("/sales"),
      ]);

      const items = Array.isArray(invRes.data) ? invRes.data : [];
      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];

      // Inventory counts
      setInventoryCount(items.length);
      const low = items.filter(
        (it) => Number(it.quantity) <= LOW_STOCK_THRESHOLD
      ).length;
      setLowStockCount(low);

      // Sales counts & revenue
      setSalesCount(sales.length);
      // If your sale model uses total property, use sale.total; otherwise compute price * quantity
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
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/inventory"
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Inventory
          </Link>
          <Link
            to="/sales"
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            Sales
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Inventory Items</div>
          <div className="text-2xl font-bold">{inventoryCount}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">
            Low Stock Items (&le; {LOW_STOCK_THRESHOLD})
          </div>
          <div className="text-2xl font-bold">{lowStockCount}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Sales</div>
          <div className="text-2xl font-bold">{salesCount}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold">
            ₱{totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Quick Actions</h2>
        <div className="flex gap-2">
          <Link
            to="/inventory"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            View Inventory
          </Link>
          <Link
            to="/sales"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            View Sales
          </Link>
          <button onClick={fetchData} className="px-4 py-2 border rounded">
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
