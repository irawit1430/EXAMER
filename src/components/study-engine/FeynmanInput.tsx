"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import {
  Brain,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface FeynmanInputProps {
  conceptName: string;
  onSubmit: (explanation: string) => void;
  evaluation?: {
    clarityScore: number;
    misunderstandings: string[];
    strengths: string[];
    feedback: string;
  } | null;
  isEvaluating: boolean;
}

export default function FeynmanInput({
  conceptName,
  onSubmit,
  evaluation,
  isEvaluating,
}: FeynmanInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim() || isEvaluating) return;
    onSubmit(text.trim());
  };

  return (
    <div className="animate-slide-up">
      <div className="bg-surface-50 border border-border-subtle shadow-sm rounded-[24px] p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-brand-primary/10">
            <Brain className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-text-primary">
              Feynman Mode
            </h3>
            <p className="text-sm font-medium text-text-secondary">
              Explain &ldquo;{conceptName}&rdquo; like you&apos;re teaching a
              5-year-old
            </p>
          </div>
        </div>

        {/* Instruction */}
        <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 mb-6">
          <p className="text-sm font-medium text-brand-primary/80 leading-relaxed">
            Type your understanding of this concept in your own words. No
            jargon, no textbook language. Our AI will evaluate your semantic
            accuracy and highlight exact misunderstandings.
          </p>
        </div>

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start explaining... Use analogies, examples, anything that shows understanding."
          rows={6}
          className="w-full px-5 py-4 rounded-2xl bg-surface-100 border border-border-subtle
            text-sm font-medium text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10
            transition-all duration-200 resize-none leading-relaxed"
          disabled={isEvaluating || !!evaluation}
        />

        {/* Character count */}
        <div className="flex items-center justify-between mt-3 mb-6">
          <span className="text-xs font-semibold text-text-muted">
            {text.length > 0
              ? `${text.split(/\s+/).length} words`
              : "Start typing..."}
          </span>
          <span
            className={`text-xs font-bold ${text.length < 50 ? "text-accent-amber" : "text-success"}`}
          >
            {text.length < 50 ? "Needs more detail" : "✓ Good length"}
          </span>
        </div>

        {/* Submit */}
        {!evaluation && (
          <Button
            onClick={handleSubmit}
            loading={isEvaluating}
            disabled={text.length < 20}
            className="w-full"
            icon={
              isEvaluating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )
            }
          >
            {isEvaluating ? "AI is evaluating..." : "Submit for Evaluation"}
          </Button>
        )}

        {/* Evaluation Results */}
        {evaluation && (
          <div className="space-y-4 animate-fade-in mt-6">
            {/* Score */}
            <div className="flex items-center gap-5 p-5 rounded-2xl bg-surface-100 border border-border-subtle">
              <div
                className={`w-16 h-16 rounded-[20px] flex items-center justify-center text-2xl font-display font-bold shadow-sm
                  ${
                    evaluation.clarityScore >= 80
                      ? "bg-success/15 text-success"
                      : evaluation.clarityScore >= 50
                        ? "bg-accent-amber/15 text-accent-amber"
                        : "bg-danger/15 text-danger"
                  }`}
              >
                {evaluation.clarityScore}
              </div>
              <div>
                <p className="text-base font-bold text-text-primary">
                  Clarity Score
                </p>
                <p className="text-sm font-medium text-text-secondary mt-1">
                  {evaluation.clarityScore >= 80
                    ? "Excellent understanding"
                    : evaluation.clarityScore >= 50
                      ? "Partial understanding — gaps found"
                      : "Significant misunderstandings"}
                </p>
              </div>
            </div>

            {/* Strengths */}
            {evaluation.strengths.length > 0 && (
              <div className="p-4 rounded-2xl bg-success/10 border border-success/20">
                <p className="text-sm font-bold text-success mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> What you got right
                </p>
                <ul className="space-y-2">
                  {evaluation.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm font-medium text-success/80 flex items-start"
                    >
                      <span className="mr-2">•</span> <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Misunderstandings */}
            {evaluation.misunderstandings.length > 0 && (
              <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20">
                <p className="text-sm font-bold text-danger mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Gaps in understanding
                </p>
                <ul className="space-y-2">
                  {evaluation.misunderstandings.map((m, i) => (
                    <li
                      key={i}
                      className="text-sm font-medium text-danger/80 flex items-start"
                    >
                      <span className="mr-2">•</span> <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Feedback */}
            <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
              <p className="text-sm font-bold text-brand-primary mb-2">
                Mentor says:
              </p>
              <p className="text-sm font-medium text-text-secondary leading-relaxed italic">
                &ldquo;{evaluation.feedback}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
