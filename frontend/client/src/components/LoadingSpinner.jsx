import { Loader2 } from "lucide-react";

export default function LoadingSpinner({
  size = "default",
  text = "Loading...",
}) {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={`${sizeClasses[size]} text-primary-600 animate-spin`}
      />
      {text && (
        <span className="text-gray-500 text-sm font-medium">{text}</span>
      )}
    </div>
  );
}
