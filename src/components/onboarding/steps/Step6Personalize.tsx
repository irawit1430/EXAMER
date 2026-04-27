"use client";

import React from "react";
import { OnboardingData } from "../OnboardingFlow";

interface Props {
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;
}

const PERSONAL_QUESTIONS = [
  {
    id: "targetExam",
    type: "text",
    label: "What specific exam are you preparing for?",
    placeholder: "e.g., USMLE Step 1, JEE Advanced, SAT...",
  },
  {
    id: "q1",
    type: "text",
    label: "What distracts you the most while studying?",
    placeholder: "e.g., Social media, day-dreaming, noise...",
  },
  {
    id: "q2",
    type: "select",
    label: "Do you absorb information better through visuals or reading?",
    options: ["Visuals (Videos/Diagrams)", "Reading (Text)", "Both equally"],
  },
  {
    id: "q3",
    type: "date",
    label: "When is your actual exam date?",
    placeholder: "Select date",
  },
  {
    id: "q4",
    type: "select",
    label: "What time of day do you feel most productive?",
    options: ["Early Morning", "Late Morning", "Afternoon", "Late Night"],
  },
  {
    id: "q5",
    type: "text",
    label: "How do you handle exam-related anxiety?",
    placeholder: "e.g., I listen to music, I panic, I take deep breaths...",
  },
];

export default function Step6Personalize({ data, updateData }: Props) {
  const handleAnswerChange = (questionId: string, value: string) => {
    updateData({
      personalizedAnswers: {
        ...data.personalizedAnswers,
        [questionId]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative z-0">
      <h2 className="text-2xl font-display font-bold text-text-primary mb-2 tracking-tight">
        Final Calibration
      </h2>
      <p className="text-text-secondary text-[13px] mb-6 leading-relaxed max-w-xl font-medium">
        Tell us a little more so your AI Mentor can adapt to your personality.
      </p>

      <div className="space-y-5 flex-1 overflow-y-auto pr-4 pb-4 scrollbar-thin scrollbar-thumb-surface-300 scrollbar-track-transparent">
        {PERSONAL_QUESTIONS.map((q) => (
          <div key={q.id} className="space-y-1.5">
            <label htmlFor={q.id} className="block text-[13px] font-semibold text-text-primary">
              {q.label}
            </label>
            {q.type === "text" && (
              <input
                id={q.id}
                type="text"
                placeholder={q.placeholder}
                value={data.personalizedAnswers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-50 hover:bg-white border-2 border-border-default text-text-primary text-[13px] font-medium focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all placeholder:text-text-muted shadow-sm"
              />
            )}
            {q.type === "date" && (
              <input
                id={q.id}
                type="date"
                value={data.personalizedAnswers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-50 hover:bg-white border-2 border-border-default text-text-primary text-[13px] font-medium focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all cursor-pointer shadow-sm"
              />
            )}
            {q.type === "select" && (
              <div className="relative">
                <select
                  id={q.id}
                  value={data.personalizedAnswers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-50 hover:bg-white border-2 border-border-default text-text-primary text-[13px] font-medium focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all cursor-pointer appearance-none shadow-sm"
                >
                  <option value="" disabled>
                    Select an option
                  </option>
                  {q.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center px-2 text-text-muted">
                  <svg
                    className="fill-current h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
