import { NavLink } from "react-router-dom";

export default function NavItem({ to, icon: Icon, label, variant = "sidebar" }) {
  if (variant === "bottom") {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            isActive
              ? "text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`
        }
      >
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium">{label}</span>
      </NavLink>
    );
  }

  // sidebar variant
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isActive
            ? "bg-primary-50 text-primary-600 font-medium"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  );
}
