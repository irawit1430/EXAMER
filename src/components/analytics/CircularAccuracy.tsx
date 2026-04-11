import React from "react";

interface CircularAccuracyProps {
  correct: number;
  total: number;
}

export default function CircularAccuracy({ correct, total }: CircularAccuracyProps) {
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  // Dynamic offset calculation:
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="hidden sm:flex items-center gap-3 bg-surface-50 p-1.5 pr-5 rounded-full border border-border-subtle shadow-sm"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="relative w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-border-subtle">
        <svg width="40" height="40" className="transform -rotate-90">
          {/* Track Circle */}
          <circle
            cx="20" cy="20" r={radius}
            stroke="var(--surface-200, #e8e8ed)"
            strokeWidth="3.5"
            fill="none"
          />
          {/* Progress Circle */}
          <circle
            cx="20" cy="20" r={radius}
            stroke="#10b981" // iOS-style green for accuracy success
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
      </div>
      <div className="flex flex-col justify-center">
        {/* STRICT TYPOGRAPHIC TOKENS: Microcopy Rule */}
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] leading-none mb-0.5">
          Accuracy
        </span>
        <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-text-primary leading-none">
          <span>{correct} / {total}</span>
        </div>
      </div>
    </div>
  );
}