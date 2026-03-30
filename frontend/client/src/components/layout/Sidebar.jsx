import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import NavItem from "./NavItem";
import FeedbackModal from "../FeedbackModal";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Shield,
  LogOut,
  Utensils,
  MessageSquare,
} from "lucide-react";

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white border-r border-gray-200 z-50">
      {/* Logo/Brand Header */}
      <div className={`flex items-center gap-3 px-6 h-16 border-b flex-shrink-0 ${
        isAdmin()
          ? "bg-gradient-to-r from-purple-700 to-purple-800 border-purple-900"
          : "border-gray-200"
      }`}>
        <div className="w-10 h-10 flex-shrink-0">
          <img src="/apple-touch-icon.png" alt="Sarinya Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className={`text-lg font-bold ${isAdmin() ? "text-white" : "text-gray-900"}`}>
            Sarinya
          </h1>
          <p className={`text-xs ${isAdmin() ? "text-purple-200" : "text-gray-500"}`}>
            Kitchenette
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

        <NavItem to="/sell" icon={Utensils} label="Take Order" />

        <NavItem to="/inventory" icon={Package} label="Stocks" />

        <NavItem to="/products" icon={Tag} label="Products" />

        <NavItem to="/sales" icon={ShoppingCart} label="Sales" />

        {isAdmin() && (
          <NavItem to="/admin" icon={Shield} label="Admin" />
        )}

        <button
          onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors text-sm font-medium"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Feedback</span>
        </button>
      </nav>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      {/* User Info + Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-gray-50 rounded-xl">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isAdmin() ? "bg-purple-100" : "bg-primary-100"
          }`}>
            <span className={`font-semibold text-sm ${
              isAdmin() ? "text-purple-600" : "text-primary-600"
            }`}>
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.username}
            </p>
            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
              isAdmin()
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {user?.role}
            </span>
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
