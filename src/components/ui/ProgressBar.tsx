"use client";

import React from "react";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: "brand" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const variantGradients: Record<string, string> = {
  brand: "bg-brand-primary",
  success: "bg-success",
  warning: "bg-accent-amber",
  danger: "bg-danger",
};

const sizeStyles: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export default function ProgressBar({
  value,
  max = 100,
  variant = "brand",
  size = "md",
  showLabel = false,
  label,
  animated = true,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-semibold text-text-secondary">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-xs font-bold text-text-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full rounded-full bg-surface-200 overflow-hidden ${sizeStyles[size]}`}
      >
        <div
          className={`h-full rounded-full ${variantGradients[variant]}
            ${animated ? "transition-all duration-700 ease-out" : ""}`}
          style={{ width: `${percentage}%` }}
        >
          {animated && (
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
          )}
        </div>
      </div>
    </div>
  );
}
