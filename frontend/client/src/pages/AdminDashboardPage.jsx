import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUsers } from "../services/userService";
import LogoutButton from "../components/LogoutButton";
import StatsCard from "../components/StatsCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";
import {
  Users,
  Shield,
  UserCheck,
  LayoutDashboard,
  ArrowRight,
  Settings,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    staffCount: 0,
    activeUsers: 0,
  });
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const users = await getUsers();
      setStats({
        totalUsers: users.length,
        adminCount: users.filter((u) => u.role === "admin").length,
        staffCount: users.filter((u) => u.role === "staff").length,
        activeUsers: users.filter((u) => u.isActive).length,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" text="Loading admin dashboard..." />
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Welcome, {user?.username}
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
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            colorScheme="primary"
          />
          <StatsCard
            title="Admins"
            value={stats.adminCount}
            icon={Shield}
            colorScheme="warning"
          />
          <StatsCard
            title="Staff"
            value={stats.staffCount}
            icon={UserCheck}
            colorScheme="success"
          />
          <StatsCard
            title="Active Users"
            value={stats.activeUsers}
            icon={Users}
            colorScheme="success"
          />
        </div>

        {/* Quick Actions */}
        <div className="card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Admin Actions
          </h2>

          <div className="flex flex-wrap gap-3">
            <Link to="/admin/users">
              <Button icon={Users} variant="primary">
                Manage Users
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>

            <Link to="/dashboard">
              <Button variant="outline" icon={LayoutDashboard}>
                Main Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
