interface AdminBadgeProps {
  children: string;
  variant?: "default" | "brand" | "success" | "warning" | "danger" | "info";
}

const variantStyles: Record<string, string> = {
  default: "bg-white/10 text-white/60",
  brand: "bg-maw-magenta/20 text-maw-magenta",
  success: "bg-green-500/20 text-green-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  danger: "bg-red-500/20 text-red-400",
  info: "bg-blue-500/20 text-blue-400",
};

export default function AdminBadge({
  children,
  variant = "default",
}: AdminBadgeProps) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-medium ${variantStyles[variant] || variantStyles.default}`}
    >
      {children}
    </span>
  );
}
