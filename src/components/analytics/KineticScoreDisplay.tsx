"use client";

import React, { useEffect, useRef } from "react";

interface KineticScoreDisplayProps {
  score: number;
  maxScore: number;
  delta: number; // +/- from last week
  label?: string;
}

export default function KineticScoreDisplay({
  score,
  maxScore,
  delta,
  label = "Predicted Exam Score",
}: KineticScoreDisplayProps) {
  const scoreRef = useRef<HTMLSpanElement>(null);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const el = scoreRef.current;
    if (!el) return;

    // Animate score counter
    const start = prevScoreRef.current;
    const end = score;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      el.textContent = String(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevScoreRef.current = score;

    // GSAP glow effect (when available)
    // This will work when gsap is loaded in the browser
    import("gsap")
      .then(({ default: gsap }) => {
        if (delta > 0) {
          gsap.fromTo(
            el,
            {
              textShadow: "0 0 0px rgba(16, 185, 129, 0)",
            },
            {
              textShadow: "0 0 30px rgba(16, 185, 129, 0.6)",
              duration: 0.6,
              yoyo: true,
              repeat: 1,
              ease: "power2.inOut",
            },
          );
        }
      })
      .catch(() => {
        // GSAP not available, skip animation
      });
  }, [score, delta]);

  const isPositive = delta >= 0;
  const scorePercentage = (score / maxScore) * 100;

  return (
    <div className="relative flex flex-col justify-between h-full p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">
          {label}
        </h2>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
            isPositive
              ? "text-success bg-success/10"
              : "text-danger bg-danger/10"
          }`}
        >
          <span>{isPositive ? "↑" : "↓"}</span>
          <span>{Math.abs(delta)}</span>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1.5 mt-auto">
        <span
          ref={scoreRef}
          className="text-4xl sm:text-5xl font-display font-medium tracking-tight text-text-primary"
        >
          {score}
        </span>
        <span className="text-lg font-medium text-text-muted">/{maxScore}</span>
      </div>

      {/* Progress arc */}
      <div className="mt-5 relative">
        <div className="w-full h-1.5 rounded-full bg-surface-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-1000 ease-out"
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-medium text-text-muted">Min</span>
          <span className="text-[10px] font-medium text-text-muted">Target {maxScore}</span>
        </div>
      </div>
    </div>
  );
}
