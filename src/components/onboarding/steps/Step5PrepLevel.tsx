"use client";

import React from "react";
import { OnboardingData } from "../OnboardingFlow";
import { Compass, BookCopy, TrendingUp, CheckCircle } from "lucide-react";

interface Props {
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;
}

const LEVELS = [
  {
    value: "Beginner",
    label: "Just Starting",
    desc: "I haven't covered much yet.",
    icon: Compass,
  },
  {
    value: "Intermediate",
    label: "Covered Basics",
    desc: "I know the fundamentals.",
    icon: BookCopy,
  },
  {
    value: "Advanced",
    label: "Halfway There",
    desc: "Deep into the syllabus.",
    icon: TrendingUp,
  },
  {
    value: "Expert",
    label: "Revision Phase",
    desc: "Just doing mocks and review.",
    icon: CheckCircle,
  },
];

export default function Step5PrepLevel({ data, updateData }: Props) {
  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      <h2 className="text-2xl font-display font-bold text-text-primary mb-2 tracking-tight">
        Current Prep Level
      </h2>
      <p className="text-text-secondary text-[13px] mb-6 leading-relaxed max-w-xl font-medium">
        Where do you stand right now? This helps us calibrate your starting
        point.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {LEVELS.map((lvl) => (
          <button
            key={lvl.value}
            onClick={() => updateData({ prepLevel: lvl.value })}
            aria-pressed={data.prepLevel === lvl.value}
            className={`p-4 rounded-xl border-2 flex items-center text-left transition-all duration-300 min-h-[80px] ${
              data.prepLevel === lvl.value
                ? "border-brand-primary bg-brand-primary/5 shadow-sm scale-[1.02]"
                : "border-border-default hover:border-border-subtle hover:bg-surface-50 hover:shadow-sm"
            }`}
          >
            <div
              className={`p-2.5 shrink-0 rounded-lg flex items-center justify-center mr-4 transition-colors ${data.prepLevel === lvl.value ? "bg-brand-primary/10" : "bg-surface-200"}`}
            >
              <lvl.icon
                className={`w-5 h-5 ${data.prepLevel === lvl.value ? "text-brand-primary" : "text-text-secondary"}`}
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-[15px] font-bold tracking-tight ${data.prepLevel === lvl.value ? "text-brand-primary" : "text-text-primary"}`}
              >
                {lvl.label}
              </span>
              <span className="text-[13px] font-medium text-text-secondary mt-0.5">
                {lvl.desc}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
