import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import NavItem from "./NavItem";
import {
  ChefHat,
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Shield,
  LogOut,
  Utensils,
} from "lucide-react";

export default function Sidebar() {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white border-r border-gray-200 z-50">
      {/* Logo/Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-200">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sarinya</h1>
          <p className="text-xs text-gray-500">Kitchnette</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {hasPermission("sales", "add") && (
          <NavItem to="/sell" icon={Utensils} label="Take Order" />
        )}

        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

        {hasPermission("inventory", "view") && (
          <NavItem to="/inventory" icon={Package} label="Stocks" />
        )}

        {hasPermission("inventory", "view") && (
          <NavItem to="/products" icon={Tag} label="Products" />
        )}

        {hasPermission("sales", "view") && (
          <NavItem to="/sales" icon={ShoppingCart} label="Sales" />
        )}

        {isAdmin() && (
          <NavItem to="/admin" icon={Shield} label="Admin" />
        )}
      </nav>

      {/* User Info + Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
