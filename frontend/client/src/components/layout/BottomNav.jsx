import { useAuth } from "../../contexts/AuthContext";
import NavItem from "./NavItem";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Shield,
} from "lucide-react";

export default function BottomNav() {
  const { isAdmin, hasPermission } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        <NavItem
          to="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          variant="bottom"
        />

        {hasPermission("inventory", "view") && (
          <NavItem
            to="/inventory"
            icon={Package}
            label="Inventory"
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
      </div>
    </nav>
  );
}
