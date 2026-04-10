import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  className = "",
  hover = false,
  glow = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`glass-card ${paddingStyles[padding]}
        ${hover ? "glass-card-hover cursor-pointer" : ""}
        ${glow ? "glow-brand" : ""}
        ${className}`}
    >
      {children}
    </div>
  );
}
