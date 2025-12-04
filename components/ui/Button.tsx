"use client";

import { Loader2 } from "lucide-react";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "google";
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = ({
  variant = "primary",
  isLoading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
    outline:
      "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-950",
    google:
      "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        icon && <span>{icon}</span>
      )}
      {children}
    </button>
  );
};

export default Button;
