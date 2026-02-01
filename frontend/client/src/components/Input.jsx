import { AlertCircle, CheckCircle } from "lucide-react";

export default function Input({
  label,
  error,
  success,
  helperText,
  icon: Icon = null,
  className = "",
  ...props
}) {
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}

        <input
          className={`
            w-full px-4 py-3 border rounded-lg
            text-gray-900 placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-4
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${Icon ? "pl-10" : ""}
            ${
              hasError
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-100"
                : hasSuccess
                ? "border-success-500 focus:border-success-500 focus:ring-success-100"
                : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
            }
            ${className}
          `}
          {...props}
        />

        {(hasError || hasSuccess) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError && <AlertCircle className="w-5 h-5 text-danger-500" />}
            {hasSuccess && <CheckCircle className="w-5 h-5 text-success-500" />}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p
          className={`mt-1.5 text-sm ${
            hasError ? "text-danger-600" : "text-gray-500"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
