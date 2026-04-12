"use client";

import React, { useEffect, useRef, useState } from "react";
import { Clock, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ReadingPaneProps {
  content: string;
  title: string;
  duration: number; // target reading time in seconds
  timeElapsed: number;
  onTimerComplete: () => void;
  isBlurring: boolean; // triggers blur-out animation
}

export default function ReadingPane({
  content,
  title,
  duration,
  timeElapsed,
  onTimerComplete,
  isBlurring,
}: ReadingPaneProps) {
  const progressPercentage = Math.min((timeElapsed / duration) * 100, 100);
  const timeLeft = Math.max(duration - timeElapsed, 0);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`relative ${isBlurring ? "content-blur-out" : ""}`}>
      {/* Timer Bar */}
      <div className="sticky top-0 z-10 bg-surface-50/80 backdrop-blur-xl border border-border-subtle shadow-sm p-4 rounded-2xl mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-brand-primary" />
            <span className="text-sm font-bold tracking-tight text-text-primary">
              Reading Mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-muted" />
            <span
              className={`text-sm font-mono font-bold tracking-tight ${timeLeft <= 30 ? "text-accent-amber" : "text-text-primary"}`}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(41,151,255,0.4)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-surface-50 border border-border-subtle shadow-sm rounded-[24px] p-6 md:p-8">
        <h2 className="content-safe text-2xl font-display font-bold text-text-primary mb-5 border-b border-border-subtle/50 pb-4">
          {title}
        </h2>
        <div className="prose prose-sm max-w-none text-text-secondary content-safe">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-2xl font-bold text-text-primary mt-8 mb-4 border-b border-border-subtle/50 pb-2"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-xl font-bold text-text-primary mt-8 mb-4"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-lg font-semibold text-text-primary mt-6 mb-3"
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p
                  className="mb-4 leading-relaxed text-text-secondary"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc pl-5 mb-4 space-y-2 text-text-secondary marker:text-brand-primary"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal pl-5 mb-4 space-y-2 text-text-secondary marker:text-brand-primary"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-text-primary" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-accent-cyan/50 pl-4 py-1 my-4 italic bg-surface-100/50 rounded-r-lg"
                  {...props}
                />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Warning toast when time is running out */}
      {timeLeft <= 30 && timeLeft > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-accent-amber/20 border border-accent-amber/30 backdrop-blur-xl animate-slide-up">
          <p className="text-xs font-medium text-accent-amber">
            ⏱️ {timeLeft}s left — Active recall is coming
          </p>
        </div>
      )}
    </div>
  );
}
