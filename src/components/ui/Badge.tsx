import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "new" | "learning" | "review" | "mastered" | "default";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<string, string> = {
  new: "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
  learning:
    "bg-accent-amber/10 text-accent-amber border border-accent-amber/20",
  review:
    "bg-accent-violet/10 text-accent-violet border border-accent-violet/20",
  mastered: "bg-accent-emerald/10 text-success border border-accent-emerald/20",
  default: "bg-surface-100 text-text-secondary border border-border-subtle",
};

const dotColors: Record<string, string> = {
  new: "bg-brand-primary",
  learning: "bg-accent-amber",
  review: "bg-accent-violet",
  mastered: "bg-success",
  default: "bg-text-muted",
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-medium
        ${size === "sm" ? "px-2 py-0.5 text-[10px] rounded-md" : "px-2.5 py-1 text-xs rounded-lg"}
        ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
