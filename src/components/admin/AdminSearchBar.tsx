"use client";

import { Search } from "lucide-react";

interface AdminSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function AdminSearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: AdminSearchBarProps) {
  return (
    <div className="relative mb-4">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/20 focus:border-maw-magenta/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(233,30,140,0.1)] [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#1a1a2e_inset]"
      />
    </div>
  );
}
