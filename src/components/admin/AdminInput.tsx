"use client";

import { type InputHTMLAttributes, type ReactNode } from "react";

interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}

export default function AdminInput({
  label,
  icon,
  className = "",
  ...props
}: AdminInputProps) {
  return (
    <div>
      {label && (
        <label className="text-xs text-white/50 block mb-1.5 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full bg-white/5 border border-white/10 rounded-lg ${
            icon ? "pl-9" : "px-3"
          } pr-3 py-2.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/20 focus:border-maw-magenta/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(233,30,140,0.1)] [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#1a1a2e_inset] ${className}`}
        />
      </div>
    </div>
  );
}
