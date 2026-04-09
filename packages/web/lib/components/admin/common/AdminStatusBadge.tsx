import { cn } from "@/lib/utils";

type BadgeVariant = "draft" | "approved" | "rejected" | "pending" | "active" | "hidden" | "deleted" | "error";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  deleted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  hidden: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

interface AdminStatusBadgeProps {
  status: string;
  className?: string;
}

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  const variant = (status in VARIANT_STYLES ? status : "draft") as BadgeVariant;
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {status}
    </span>
  );
}
