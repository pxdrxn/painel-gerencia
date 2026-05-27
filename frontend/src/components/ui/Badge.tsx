import { cn, getStatusColor } from "@/lib/utils";

interface BadgeProps {
  status: string;
  variant?: "status" | "role";
}

export default function Badge({ status, variant = "status" }: BadgeProps) {
  if (variant === "role") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
        {status}
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
      getStatusColor(status)
    )}>
      {status.replace("_", " ")}
    </span>
  );
}
