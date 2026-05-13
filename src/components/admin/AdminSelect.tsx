"use client";

import { type SelectHTMLAttributes } from "react";

interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export default function AdminSelect({
  label,
  className = "",
  children,
  ...props
}: AdminSelectProps) {
  return (
    <div>
      {label && (
        <label className="text-xs text-white/50 block mb-1.5 font-medium">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-all duration-300 focus:border-maw-magenta/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(233,30,140,0.1)] ${className}`}
      >
        {children}
      </select>
    </div>
  );
}
