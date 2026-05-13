"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  icon?: ReactNode;
}

export default function AdminButton({
  variant = "primary",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: AdminButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "gradient-glow hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "glass hover:bg-white/10 active:scale-[0.98]",
    danger:
      "bg-red-500/20 text-red-400 hover:bg-red-500/30 active:scale-[0.98]",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
