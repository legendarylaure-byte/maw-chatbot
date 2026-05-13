"use client";

import { type TextareaHTMLAttributes } from "react";

interface AdminTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export default function AdminTextarea({
  label,
  className = "",
  ...props
}: AdminTextareaProps) {
  return (
    <div>
      {label && (
        <label className="text-xs text-white/50 block mb-1.5 font-medium">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/20 focus:border-maw-magenta/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(233,30,140,0.1)] [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#1a1a2e_inset] ${className}`}
      />
    </div>
  );
}
