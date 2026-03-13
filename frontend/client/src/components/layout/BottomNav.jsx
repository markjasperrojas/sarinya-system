import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import NavItem from "./NavItem";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Shield,
  User,
  LogOut,
  Utensils,
} from "lucide-react";

export default function BottomNav() {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate("/");
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
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
            label="Sell"
            variant="bottom"
          />
        )}

        {hasPermission("inventory", "view") && (
          <NavItem
            to="/inventory"
            icon={Package}
            label="Inventory"
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

        {hasPermission("sales", "view") && (
          <NavItem
            to="/sales"
            icon={ShoppingCart}
            label="Sales"
            variant="bottom"
          />
        )}

        {isAdmin() && (
          <NavItem
            to="/admin"
            icon={Shield}
            label="Admin"
            variant="bottom"
          />
        )}

        {/* Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-gray-500 hover:text-primary-600 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </button>

          {/* Popup Menu */}
          {isMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* User Info */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
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
              </div>

              {/* Logout Button */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
