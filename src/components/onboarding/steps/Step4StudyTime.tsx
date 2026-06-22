"use client";

import React from "react";
import { OnboardingData } from "../OnboardingFlow";
import { Clock } from "lucide-react";

interface Props {
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;
}

const TIMES = [
  { value: "1", label: "1 Hour", desc: "Light revision" },
  { value: "2", label: "2 Hours", desc: "Steady progress" },
  { value: "4", label: "4 Hours", desc: "Serious prep" },
  { value: "6+", label: "6+ Hours", desc: "Intense grind" },
];

export default function Step4StudyTime({ data, updateData }: Props) {
  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      <h2 className="text-2xl font-display font-bold text-text-primary mb-2 tracking-tight">
        Daily Commitment
      </h2>
      <p className="text-text-secondary text-[13px] mb-6 leading-relaxed max-w-xl font-medium">
        How much time can you realistically dedicate to studying every single
        day?
        <br />
        <span className="text-[12px] italic text-brand-primary/80">
          Be honest, consistency beats intensity.
        </span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TIMES.map((time) => (
          <button
            key={time.value}
            onClick={() => updateData({ dailyStudyTime: time.value })}
            aria-pressed={data.dailyStudyTime === time.value}
            className={`p-4 rounded-xl border-2 flex items-center text-left transition-all duration-300 min-h-[80px] ${
              data.dailyStudyTime === time.value
                ? "border-brand-primary bg-brand-primary/5 shadow-sm scale-[1.02]"
                : "border-border-default hover:border-border-subtle hover:bg-surface-50 hover:shadow-sm"
            }`}
          >
            <div
              className={`p-2.5 shrink-0 rounded-lg flex items-center justify-center mr-4 transition-colors ${data.dailyStudyTime === time.value ? "bg-brand-primary/10" : "bg-surface-200"}`}
            >
              <Clock
                className={`w-5 h-5 ${data.dailyStudyTime === time.value ? "text-brand-primary" : "text-text-muted"}`}
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-[15px] font-bold tracking-tight ${data.dailyStudyTime === time.value ? "text-brand-primary" : "text-text-primary"}`}
              >
                {time.label}
              </span>
              <span className="text-[13px] font-medium text-text-secondary mt-0.5">
                {time.desc}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
