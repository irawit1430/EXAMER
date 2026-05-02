"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Brain,
} from "lucide-react";
import type { QuizQuestion } from "@/types";

interface ActiveRecallBoxProps {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void;
  onRequestFeynman: () => void;
}

export default function ActiveRecallBox({
  question,
  onAnswer,
  onRequestFeynman,
}: ActiveRecallBoxProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleSelect = (optionId: string) => {
    if (isRevealed) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsRevealed(true);
    const correct =
      question.options.find((o) => o.id === selectedOption)?.isCorrect || false;
    // Delay the callback to let the user see the result
    setTimeout(() => {
      onAnswer(correct);
    }, 2000);
  };

  const getOptionStyle = (optionId: string) => {
    if (!isRevealed) {
      return selectedOption === optionId
        ? "border-brand-primary/50 bg-brand-primary/10 shadow-[0_0_15px_rgba(41,151,255,0.1)]"
        : "border-border-subtle hover:border-brand-primary/30 hover:bg-surface-100";
    }

    const option = question.options.find((o) => o.id === optionId);
    if (option?.isCorrect) {
      return "border-success/50 bg-success/10";
    }
    if (optionId === selectedOption && !option?.isCorrect) {
      return "border-danger/50 bg-danger/10";
    }
    return "border-border-subtle opacity-50";
  };

  return (
    <div className="animate-slide-up">
      <div className="bg-surface-50 border border-border-subtle shadow-sm rounded-[24px] p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-accent-violet/10">
            <Brain className="w-5 h-5 text-accent-violet" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-text-primary">
              Active Recall
            </h3>
            <p className="text-sm font-medium text-text-secondary">
              Test your understanding — no peeking
            </p>
          </div>
        </div>

        {/* Question */}
        <p className="text-lg font-semibold text-text-primary mb-8 leading-relaxed">
          {question.question}
        </p>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, i) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={isRevealed}
              aria-pressed={selectedOption === option.id}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left
                transition-all duration-200 group ${getOptionStyle(option.id)}`}
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${
                    isRevealed && option.isCorrect
                      ? "bg-success text-white"
                      : isRevealed &&
                          option.id === selectedOption &&
                          !option.isCorrect
                        ? "bg-danger text-white"
                        : selectedOption === option.id
                          ? "bg-brand-primary text-white"
                          : "bg-surface-200 text-text-muted"
                  }`}
              >
                {isRevealed && option.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isRevealed &&
                  option.id === selectedOption &&
                  !option.isCorrect ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="text-sm font-medium text-text-secondary">
                {option.text}
              </span>
            </button>
          ))}
        </div>

        {/* Explanation (after reveal) */}
        <div aria-live="polite">
          {isRevealed && (
            <div className="p-5 rounded-2xl bg-surface-100 border border-border-subtle mb-6 animate-fade-in">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Explanation
              </p>
              <p className="text-sm font-medium text-text-secondary leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!isRevealed ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="flex-1"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Check Answer
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onRequestFeynman}
                icon={<Brain className="w-4 h-4" />}
              >
                I don&apos;t get it — Feynman Mode
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
