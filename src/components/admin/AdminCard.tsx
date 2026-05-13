"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  hover?: boolean;
}

export default function AdminCard({
  children,
  className = "",
  delay = 0,
  onClick,
  hover = true,
}: AdminCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 100, damping: 15 }}
      className={`glass rounded-xl p-4 border border-white/10 ${
        hover
          ? "hover:border-white/20 hover:shadow-lg hover:shadow-maw-magenta/5 transition-all duration-300"
          : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
