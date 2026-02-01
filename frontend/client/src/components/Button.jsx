import { Loader2 } from "lucide-react";

export default function Button({
  children,
  variant = "primary",
  size = "default",
  icon: Icon = null,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800",
    success:
      "bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 active:bg-success-800",
    danger:
      "bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 active:bg-danger-800",
    warning:
      "bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500 active:bg-warning-700",
    outline:
      "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  };

  const sizes = {
    small: "px-3 py-1.5 text-sm gap-1.5",
    default: "px-4 py-2.5 text-base gap-2",
    large: "px-6 py-3 text-lg gap-2.5",
  };

  const iconSizes = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-6 h-6",
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && (
            <Icon className={iconSizes[size]} />
          )}
          {children}
          {Icon && iconPosition === "right" && (
            <Icon className={iconSizes[size]} />
          )}
        </>
      )}
    </button>
  );
}
