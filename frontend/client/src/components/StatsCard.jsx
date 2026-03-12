import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend = null,
  trendValue = null,
  colorScheme = "primary",
  prefix = "",
  suffix = "",
  onClick = null,
}) {
  const colorSchemes = {
    primary: {
      bg: "bg-primary-50",
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      valueColor: "text-primary-700",
    },
    success: {
      bg: "bg-success-50",
      iconBg: "bg-success-100",
      iconColor: "text-success-600",
      valueColor: "text-success-700",
    },
    warning: {
      bg: "bg-warning-50",
      iconBg: "bg-warning-100",
      iconColor: "text-warning-600",
      valueColor: "text-warning-700",
    },
    danger: {
      bg: "bg-danger-50",
      iconBg: "bg-danger-100",
      iconColor: "text-danger-600",
      valueColor: "text-danger-700",
    },
  };

  const colors = colorSchemes[colorScheme];

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-success-600"
      : trend === "down"
      ? "text-danger-600"
      : "text-gray-500";

  return (
    <div
      className={`card p-6 ${colors.bg} border border-gray-100 card-hover ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p
            className={`text-3xl font-bold ${colors.valueColor} tracking-tight`}
          >
            {prefix}
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </p>

          {trendValue !== null && (
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>

        <div className={`${colors.iconBg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
      </div>
    </div>
  );
}
