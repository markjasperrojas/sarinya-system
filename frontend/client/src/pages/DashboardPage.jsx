// src/pages/DashboardPage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("sarinya_token");
    if (!token) {
      navigate("/"); // redirect to login if not logged in
    }
  }, [navigate]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 space-x-4">
        <a
          href="/inventory"
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Inventory
        </a>
        <a href="/sales" className="px-4 py-2 bg-blue-600 text-white rounded">
          Sales
        </a>
      </div>
    </div>
  );
}
