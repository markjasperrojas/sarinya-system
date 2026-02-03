import { Check } from "lucide-react";

export default function PermissionCheckbox({
  label,
  module,
  permissions,
  onChange,
  disabled = false,
}) {
  const actions = ["view", "add", "edit", "delete"];

  const handleChange = (action, checked) => {
    const newPermissions = {
      ...permissions,
      [module]: {
        ...permissions[module],
        [action]: checked,
      },
    };
    onChange(newPermissions);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3 capitalize">{label}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => (
          <label
            key={action}
            className={`flex items-center gap-2 cursor-pointer ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={permissions[module]?.[action] ?? false}
                onChange={(e) => handleChange(action, e.target.checked)}
                disabled={disabled}
                className="sr-only peer"
              />
              <div
                className={`w-5 h-5 border-2 rounded transition-all ${
                  permissions[module]?.[action]
                    ? "bg-primary-600 border-primary-600"
                    : "border-gray-300 bg-white"
                } ${disabled ? "" : "peer-focus:ring-2 peer-focus:ring-primary-200"}`}
              >
                {permissions[module]?.[action] && (
                  <Check className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700 capitalize">{action}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
