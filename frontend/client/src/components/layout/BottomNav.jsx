import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import NavItem from "./NavItem";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Shield,
  LogOut,
  Utensils,
  MoreHorizontal,
  X,
} from "lucide-react";

export default function BottomNav() {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = async () => {
    setIsDrawerOpen(false);
    await logout();
    navigate("/");
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      {/* Slide-up Drawer */}
      {isDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
          onClick={closeDrawer}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Drawer Panel */}
          <div
            className="relative bg-white rounded-t-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">More</span>
              <button
                onClick={closeDrawer}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Nav Items */}
            <div className="px-3 py-2">
              {hasPermission("sales", "view") && (
                <NavLink
                  to="/sales"
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`
                  }
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm font-medium">Sales</span>
                </NavLink>
              )}

              {isAdmin() && (
                <NavLink
                  to="/admin"
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`
                  }
                >
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">Admin</span>
                </NavLink>
              )}
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-gray-100" />

            {/* Profile Section */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-primary-600 font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>

            {/* Safe area spacing */}
            <div className="h-safe-bottom pb-4" />
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <NavItem
            to="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            variant="bottom"
          />

          {hasPermission("sales", "add") && (
            <NavItem
              to="/sell"
              icon={Utensils}
              label="Take Order"
              variant="bottom"
            />
          )}

          {hasPermission("inventory", "view") && (
            <NavItem
              to="/inventory"
              icon={Package}
              label="Stocks"
              variant="bottom"
            />
          )}

          {hasPermission("inventory", "view") && (
            <NavItem
              to="/products"
              icon={Tag}
              label="Products"
              variant="bottom"
            />
          )}

          {/* More Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-gray-500 hover:text-primary-600 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
