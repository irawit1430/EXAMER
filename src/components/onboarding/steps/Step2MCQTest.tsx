"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OnboardingData } from "../OnboardingFlow";

interface Props {
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;
  onComplete: () => void;
}

const QUESTIONS = [
  {
    id: 1,
    question: "Which of these best describes your learning style?",
    options: [
      "I need to see diagrams and charts",
      "I prefer reading textbooks",
      "I learn best by doing/practicing",
      "I like listening to lectures",
    ],
  },
  {
    id: 2,
    question: "How long can you focus before needing a break?",
    options: [
      "Less than 25 mins",
      "25 - 45 mins",
      "45 - 90 mins",
      "More than 90 mins",
    ],
  },
  {
    id: 3,
    question: "If you get a question wrong, what is your first instinct?",
    options: [
      "Check the exact answer immediately",
      "Try to re-solve it myself first",
      "Read the related theory again",
      "Skip it and come back later",
    ],
  },
  {
    id: 4,
    question: "How do you usually review for an exam?",
    options: [
      "Reread my notes multiple times",
      "Highlight textbook chapters",
      "Solve previous year question papers",
      "Teach the concepts to someone else",
    ],
  },
  {
    id: 5,
    question: "What is your biggest fear regarding the exam?",
    options: [
      "Running out of time",
      "Forgetting what I studied",
      "Tricky or unexpected questions",
      "Silly calculation mistakes",
    ],
  },
  {
    id: 6,
    question: "Do you prefer a strict schedule or flexible study hours?",
    options: [
      "Extremely strict routine",
      "Loose daily targets",
      "Study whenever I feel like it",
      "I only study under pressure",
    ],
  },
  {
    id: 7,
    question: "How comfortable are you with digital learning tools?",
    options: [
      "Very comfortable, I use them all the time",
      "Somewhat comfortable",
      "I prefer physical books but use digital sometimes",
      "I struggle with digital tools",
    ],
  },
  {
    id: 8,
    question: "When tackling a new difficult topic, how do you start?",
    options: [
      "Watch a YouTube video",
      "Read the summary first",
      "Dive straight into the problems",
      "Ask a teacher or mentor",
    ],
  },
  {
    id: 9,
    question: "How do you feel about active recall testing?",
    options: [
      "I do it daily, it works great",
      "I know about it but rarely do it",
      "I find it stressful and avoid it",
      "What is active recall?",
    ],
  },
  {
    id: 10,
    question: "What motivates you the most to study?",
    options: [
      "Getting a top rank/score",
      "Fear of failure",
      "Genuine interest in subjects",
      "Pressure from expectations",
    ],
  },
];

export default function Step2MCQTest({ data, updateData, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);

    // Save the answer to onboarding data
    const currentQ = QUESTIONS[currentIndex];
    updateData({
      diagnosticAnswers: {
        ...data.diagnosticAnswers,
        [`q${currentQ.id}`]: currentQ.options[idx],
      },
    });

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentIndex < QUESTIONS.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        onComplete();
      }
    }, 600);
  };

  const currentQ = QUESTIONS[currentIndex];

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-text-primary tracking-tight">
          Diagnostic Assessment
        </h2>
        <span className="text-[11px] uppercase tracking-widest font-semibold text-text-muted bg-surface-100 px-3 py-1 rounded-full border border-border-default shadow-sm">
          {currentIndex + 1} / 10
        </span>
      </div>

      <p className="text-text-secondary text-[12px] mb-5 leading-relaxed max-w-xl font-medium">
        Let's understand how your brain works. There are no right or wrong
        answers.
      </p>

      <div className="flex-1 w-full relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full"
          >
            <h3 className="text-[15px] font-semibold text-text-primary mb-4">
              {currentQ.question}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedOption === idx
                      ? "border-brand-primary bg-brand-primary/5 shadow-sm scale-[1.01]"
                      : "border-border-default hover:border-brand-primary/40 hover:bg-surface-50"
                  }`}
                >
                  <span
                    className={`text-[13px] leading-snug ${selectedOption === idx ? "text-brand-primary font-semibold" : "text-text-primary font-medium"}`}
                  >
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
