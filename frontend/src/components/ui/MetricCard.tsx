import { cn } from "@/lib/utils";

interface MetricCardProps {
  value: string | number;
  label: string;
  variant?: "default" | "highlight" | "danger" | "success" | "warning";
}

export default function MetricCard({ value, label, variant = "default" }: MetricCardProps) {
  const baseStyles = "flex flex-col justify-center items-center p-6 rounded-xl shadow-sm transition-all";
  
  const variants = {
    default: "bg-[#836FFF] text-white shadow-[#836FFF]/20 shadow-md",
    highlight: "bg-[#5d4ca3] text-white shadow-[#5d4ca3]/20 shadow-lg",
    danger: "bg-red-50 text-red-700 border border-red-100",
    success: "bg-green-50 text-green-700 border border-green-100",
    warning: "bg-yellow-50 text-yellow-700 border border-yellow-100",
  };

  const labelStyles = {
    default: "text-purple-100 text-xs font-bold tracking-wider uppercase mt-2 text-center",
    highlight: "text-purple-200 text-xs font-bold tracking-wider uppercase mt-2 text-center",
    danger: "text-red-500 text-xs font-bold tracking-wider uppercase mt-2 text-center",
    success: "text-green-500 text-xs font-bold tracking-wider uppercase mt-2 text-center",
    warning: "text-yellow-600 text-xs font-bold tracking-wider uppercase mt-2 text-center",
  };

  return (
    <div className={cn(baseStyles, variants[variant])}>
      <span className="text-4xl font-black tabular-nums tracking-tight text-center">
        {value}
      </span>
      <span className={cn(labelStyles[variant])}>
        {label}
      </span>
    </div>
  );
}
