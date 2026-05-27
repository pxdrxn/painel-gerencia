import { cn, getStatusColor } from "@/lib/utils";

interface BadgeProps {
  status: string;
  variant?: "status" | "role";
}

export default function Badge({ status, variant = "status" }: BadgeProps) {
  if (variant === "role") {
    let classes = "bg-purple-100 text-purple-800";
    if (status === "panfletista") {
      classes = "bg-amber-100 text-amber-800";
    } else if (status === "analista") {
      classes = "bg-blue-100 text-blue-800";
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}`}>
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
