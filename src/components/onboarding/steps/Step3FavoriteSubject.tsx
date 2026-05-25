"use client";

import React from "react";
import { OnboardingData } from "../OnboardingFlow";
import { BookOpen, Atom, Calculator, Globe, Book, Beaker } from "lucide-react";

interface Props {
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;
}

const SUBJECTS = [
  {
    id: "math",
    name: "Mathematics",
    icon: Calculator,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "physics",
    name: "Physics",
    icon: Atom,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    icon: Beaker,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "biology",
    name: "Biology",
    icon: BookOpen,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    id: "history",
    name: "History",
    icon: Globe,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "english",
    name: "English Literature",
    icon: Book,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
];

export default function Step3FavoriteSubject({ data, updateData }: Props) {
  const parsedSyllabus = React.useMemo(() => {
    try {
      return data.syllabus ? JSON.parse(data.syllabus) : null;
    } catch (e) {
      return null;
    }
  }, [data.syllabus]);

  const displaySubjects = React.useMemo(() => {
    if (
      parsedSyllabus &&
      parsedSyllabus.topics &&
      Array.isArray(parsedSyllabus.topics)
    ) {
      const icons = [BookOpen, Atom, Calculator, Globe, Book, Beaker];
      const colors = [
        { color: "text-blue-500", bg: "bg-blue-500/10" },
        { color: "text-purple-500", bg: "bg-purple-500/10" },
        { color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { color: "text-rose-500", bg: "bg-rose-500/10" },
        { color: "text-amber-500", bg: "bg-amber-500/10" },
        { color: "text-indigo-500", bg: "bg-indigo-500/10" },
      ];

      return parsedSyllabus.topics.map((t: any, i: number) => {
        const icon = icons[i % icons.length];
        const theme = colors[i % colors.length];
        return {
          id: `topic-${i}`,
          name: t.name || "Unknown Topic",
          icon: icon,
          color: theme.color,
          bg: theme.bg,
        };
      });
    }
    return SUBJECTS;
  }, [parsedSyllabus]);

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      <h2 className="text-2xl font-display font-bold text-text-primary mb-2 tracking-tight">
        What's your strongest area?
      </h2>
      <p className="text-text-secondary text-[13px] mb-6 leading-relaxed max-w-xl font-medium">
        We extracted these from your syllabus. Knowing your strengths helps us
        balance your study plan.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[350px] pr-2 pb-4">
        {displaySubjects.map((sub: any) => (
          <button
            key={sub.id}
            onClick={() => updateData({ favoriteSubject: sub.name })}
            aria-pressed={data.favoriteSubject === sub.name}
            className={`p-3.5 rounded-xl border-2 flex items-center text-left transition-all duration-300 min-h-[80px] ${
              data.favoriteSubject === sub.name
                ? "border-brand-primary bg-brand-primary/5 shadow-sm scale-[1.02]"
                : "border-border-default hover:border-border-subtle hover:bg-surface-50 hover:shadow-sm"
            }`}
          >
            <div
              className={`w-10 h-10 shrink-0 rounded-full ${sub.bg} flex items-center justify-center mr-3.5 transition-transform ${data.favoriteSubject === sub.name ? "scale-110" : ""}`}
            >
              <sub.icon className={`w-5 h-5 ${sub.color}`} />
            </div>
            <span
              className={`text-[13px] leading-snug transition-colors ${data.favoriteSubject === sub.name ? "text-brand-primary font-bold" : "text-text-primary font-semibold"} line-clamp-2`}
              title={sub.name}
            >
              {sub.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
