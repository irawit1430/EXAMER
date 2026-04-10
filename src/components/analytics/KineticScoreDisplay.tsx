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
    <div className="relative overflow-hidden rounded-2xl p-5 bg-surface-50 border border-border-subtle shadow-sm h-full flex flex-col justify-center">
      {/* Background glow */}
      <div
        className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[80px] opacity-10
          ${isPositive ? "bg-success" : "bg-danger"}`}
      />

      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 relative z-10">
        {label}
      </p>

      {/* Score */}
      <div className="flex items-baseline gap-2 relative z-10">
        <span
          ref={scoreRef}
          className={`score-display text-5xl font-display font-bold ${isPositive ? "text-text-primary" : "text-danger"}`}
        >
          {score}
        </span>
        <span className="text-2xl font-display font-bold text-text-muted">
          /{maxScore}
        </span>
      </div>

      {/* Delta */}
      <div className="flex items-center gap-2 mt-3 relative z-10">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold
            ${isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(delta)}
        </span>
        <span className="text-xs font-medium text-text-muted">
          from last week
        </span>
      </div>

      {/* Progress arc */}
      <div className="mt-6 relative z-10">
        <div className="w-full h-2 rounded-full bg-surface-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out
              ${isPositive ? "bg-brand-primary" : "bg-danger"}`}
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-medium text-text-muted">0</span>
          <span className="text-[10px] font-medium text-text-muted">
            {maxScore}
          </span>
        </div>
      </div>
    </div>
  );
}
