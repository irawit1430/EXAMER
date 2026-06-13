"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// =============================================
// Rich Mentor Message Renderer
// =============================================
// Detects structured patterns in mentor text and
// renders them as interactive, visual cards instead
// of flat markdown blobs.
// =============================================

interface MentorMessageProps {
  text: string;
  role: "mentor" | "user";
  timestamp?: number;
  isStreaming?: boolean;
  onOptionSelect?: (questionId: string, option: string) => void;
  /** When true, uses full-page sizing (larger text, more spacing) */
  fullPage?: boolean;
}

// --- Pattern Detection ---

interface ParsedBlock {
  type: "text" | "concept" | "mcq" | "feedback_correct" | "feedback_wrong" | "keypoint" | "action_link";
  content: string;
  meta?: Record<string, string>;
}

/**
 * Parse the mentor's markdown text into rich blocks.
 * Detects MCQ patterns, concept headers, feedback patterns, etc.
 */
function parseBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  // Ensure action links are isolated on their own lines for parsing
  const textWithIsolatedLinks = text.replace(/(\/mocks\/[a-zA-Z0-9\-_=?&%.$]+)/g, "\n\n$1\n\n");
  const lines = textWithIsolatedLinks.split("\n");
  let buffer: string[] = [];
  let i = 0;

  const flushBuffer = () => {
    if (buffer.length > 0) {
      const joined = buffer.join("\n").trim();
      if (joined) blocks.push({ type: "text", content: joined });
      buffer = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Detect MCQ pattern: "**Q1.** ..." or "**Question 1:**"
    const mcqMatch = line.match(/^\*\*(?:Q\d+[.:]?|Question\s*\d*[.:]?)\*\*\s*(.*)/i);
    if (mcqMatch) {
      flushBuffer();
      const questionLines: string[] = [mcqMatch[1] || ""];
      i++;
      // Collect options (A), B), C), D) or **A.**, **B.** etc
      while (i < lines.length) {
        const optMatch = lines[i].match(/^(?:\*\*)?[A-D][.)]\*?\*?\s*(.*)/);
        if (optMatch || lines[i].match(/^[A-D][.)]\s/)) {
          questionLines.push(lines[i]);
          i++;
        } else if (lines[i].trim() === "") {
          i++;
          break;
        } else {
          break;
        }
      }
      blocks.push({
        type: "mcq",
        content: questionLines.join("\n"),
      });
      continue;
    }

    // Detect concept header: "## Concept:" or "### Key Concept" or "**Concept:**"
    const conceptMatch = line.match(/^(?:#{2,3}\s+|)\*\*(?:Concept|Key Concept|Topic|Definition)[:\s]*\*\*\s*(.*)/i);
    if (conceptMatch) {
      flushBuffer();
      const conceptLines: string[] = [conceptMatch[1] || ""];
      i++;
      // Collect until empty line or next header
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].match(/^#{1,3}\s/)) {
        conceptLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "concept",
        content: conceptLines.join("\n"),
      });
      continue;
    }

    // Detect correct feedback: "✅" or "Correct!" or "That's right"
    const correctMatch = line.match(/^(?:✅|✓|☑️|🎉)\s*(.*)/);
    const correctTextMatch = !correctMatch && line.match(/^(?:\*\*)?(?:Correct|That's right|Well done|Great job|Excellent|Perfect)[!.]*(?:\*\*)?\s*(.*)/i);
    if (correctMatch || correctTextMatch) {
      flushBuffer();
      const match = correctMatch || correctTextMatch;
      const feedbackLines: string[] = [match ? match[1] || "" : ""];
      i++;
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].match(/^#{1,3}\s/)) {
        feedbackLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "feedback_correct",
        content: feedbackLines.join("\n"),
      });
      continue;
    }

    // Detect wrong feedback: "❌" or "Incorrect" or "Not quite"
    const wrongMatch = line.match(/^(?:❌|✗|🤔)\s*(.*)/);
    const wrongTextMatch = !wrongMatch && line.match(/^(?:\*\*)?(?:Incorrect|Not quite|That's not|Wrong|Close, but)[!.,]*(?:\*\*)?\s*(.*)/i);
    if (wrongMatch || wrongTextMatch) {
      flushBuffer();
      const match = wrongMatch || wrongTextMatch;
      const feedbackLines: string[] = [match ? match[1] || "" : ""];
      i++;
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].match(/^#{1,3}\s/)) {
        feedbackLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "feedback_wrong",
        content: feedbackLines.join("\n"),
      });
      continue;
    }

    // Detect standalone action links (e.g., /mocks/...) 
    const actionLinkMatch = line.match(/^\/mocks\/[a-zA-Z0-9\-_=?&%.$]+$/);
    if (actionLinkMatch) {
      flushBuffer();
      blocks.push({
        type: "action_link",
        content: line.trim(),
      });
      i++;
      continue;
    }

    buffer.push(line);
    i++;
  }

  flushBuffer();
  return blocks;
}

/**
 * Parse MCQ options from text like:
 * A) First option
 * B) Second option
 */
function parseMCQOptions(text: string): { question: string; options: { label: string; text: string }[] } {
  const lines = text.split("\n");
  const questionParts: string[] = [];
  const options: { label: string; text: string }[] = [];

  for (const line of lines) {
    const optMatch = line.match(/^(?:\*\*)?([A-D])[.)]\*?\*?\s*(.*)/);
    if (optMatch) {
      options.push({ label: optMatch[1], text: optMatch[2].replace(/\*\*/g, "").trim() });
    } else if (line.trim()) {
      questionParts.push(line);
    }
  }

  return { question: questionParts.join(" ").trim(), options };
}

// =============================================
// Sub-Components
// =============================================

function ActionLinkCard({ url, fullPage }: { url: string; fullPage?: boolean }) {
  let title = "Launch Mock Test";
  const subtitle = "Your test is ready.";

  try {
    const urlObj = new URL(url, "http://localhost");
    const nameParam = urlObj.searchParams.get("name");
    if (nameParam) {
      title = nameParam;
    }
  } catch (e) {
    // Ignore parsing errors
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-brand-accent/20 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ${
        fullPage ? "my-5" : "my-3"
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
          <ExternalLink className="w-5 h-5 text-brand-accent" />
        </div>
        <div>
          <h4 className="font-semibold text-text-primary text-sm line-clamp-2 leading-snug">
            {title}
          </h4>
          <p className="text-xs text-text-muted mt-1">{subtitle}</p>
        </div>
      </div>
      <Link
        href={url}
        className="w-full sm:w-auto px-5 py-2.5 bg-brand-accent text-white rounded-xl text-center text-sm font-medium hover:bg-brand-accent/90 transition-colors shadow-sm whitespace-nowrap"
      >
        Start Attempt
      </Link>
    </motion.div>
  );
}

function ConceptCard({ content, fullPage }: { content: string; fullPage?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-brand-accent/20 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 overflow-hidden ${fullPage ? "my-4" : "my-2"}`}
    >
      <button
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <div className="w-8 h-8 rounded-xl bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-brand-accent" />
        </div>
        <span className={`font-semibold text-brand-accent flex-1 ${fullPage ? "text-base" : "text-sm"}`}>
          Concept Explanation
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-brand-accent/50" /> : <ChevronDown className="w-4 h-4 text-brand-accent/50" />}
      </button>
      <div aria-live="polite">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`px-4 pb-4 leading-relaxed text-text-primary ${fullPage ? "text-[15px]" : "text-[13px]"}`}>
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MCQCard({
  content,
  onSelect,
  fullPage,
}: {
  content: string;
  onSelect?: (option: string) => void;
  fullPage?: boolean;
}) {
  const { question, options } = parseMCQOptions(content);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (label: string) => {
    setSelected(label);
    onSelect?.(label);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/50 overflow-hidden ${fullPage ? "my-4" : "my-2"}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-200/40">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-amber-600" />
        </div>
        <span className={`font-semibold text-amber-800 ${fullPage ? "text-base" : "text-sm"}`}>
          Quick Check
        </span>
      </div>
      <div className="p-4">
        <p className={`font-medium text-text-primary mb-3 leading-relaxed ${fullPage ? "text-[15px]" : "text-[13px]"}`}>
          {question}
        </p>
        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              aria-pressed={selected === opt.label}
              onClick={() => handleSelect(opt.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary
                ${selected === opt.label
                  ? "border-brand-accent/50 bg-brand-accent/5 shadow-sm ring-1 ring-brand-accent/20"
                  : "border-border-subtle hover:border-amber-300/60 hover:bg-white/60"
                }`}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                  ${selected === opt.label
                    ? "bg-brand-accent text-white"
                    : "bg-surface-100 text-text-muted"
                  }`}
              >
                {opt.label}
              </span>
              <span className={`text-text-primary ${fullPage ? "text-[14px]" : "text-[12px]"}`}>
                {opt.text}
              </span>
            </button>
          ))}
        </div>
        {selected && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-xs text-text-muted text-center"
          >
            Type your reasoning or just send "{selected}" to submit
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

function FeedbackCard({
  content,
  correct,
  fullPage,
}: {
  content: string;
  correct: boolean;
  fullPage?: boolean;
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Split content: first line is the main feedback, rest is explanation
  const lines = content.split("\n");
  const mainFeedback = lines[0] || (correct ? "Great job!" : "Not quite right.");
  const explanation = lines.slice(1).join("\n").trim();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border overflow-hidden ${fullPage ? "my-4" : "my-2"} ${
        correct
          ? "border-green-200/60 bg-gradient-to-br from-green-50/90 to-emerald-50/60"
          : "border-red-200/60 bg-gradient-to-br from-red-50/90 to-orange-50/60"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            correct ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {correct ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold ${fullPage ? "text-base" : "text-sm"} ${
              correct ? "text-green-800" : "text-red-800"
            }`}
          >
            {correct ? "Correct!" : "Not quite right"}
          </p>
          <p className={`mt-1 leading-relaxed ${fullPage ? "text-[14px]" : "text-[12px]"} ${
            correct ? "text-green-700" : "text-red-700"
          }`}>
            {mainFeedback}
          </p>
        </div>
      </div>
      {explanation && (
        <>
          <button
            aria-expanded={showExplanation}
            onClick={() => setShowExplanation(!showExplanation)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors border-t focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
              correct
                ? "border-green-200/40 text-green-700 hover:bg-green-50/60"
                : "border-red-200/40 text-red-700 hover:bg-red-50/60"
            }`}
          >
            <ArrowRight className={`w-3 h-3 transition-transform ${showExplanation ? "rotate-90" : ""}`} />
            {showExplanation ? "Hide explanation" : "Show explanation"}
          </button>
          <div aria-live="polite">
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`px-4 pb-4 ${fullPage ? "text-[14px]" : "text-[12px]"} text-text-secondary leading-relaxed`}>
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  );
}

// =============================================
// Main Component
// =============================================

export default function MentorMessage({
  text,
  role,
  timestamp,
  isStreaming,
  onOptionSelect,
  fullPage = false,
}: MentorMessageProps) {
  if (role === "user") {
    return (
      <div className={`flex justify-end ${fullPage ? "mb-6" : "mb-4"}`}>
        <div
          className={`rounded-2xl rounded-br-sm bg-brand-primary text-white shadow-sm ${
            fullPage ? "max-w-[70%] px-5 py-4" : "max-w-[84%] px-4 py-3"
          }`}
        >
          {fullPage && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60 mb-1">
              You
            </p>
          )}
          <p className={`leading-relaxed ${fullPage ? "text-[15px]" : "text-[14px]"}`}>{text}</p>
          {timestamp && (
            <p className="mt-2 text-[10px] text-white/50">
              {new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(timestamp)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Mentor message: detect and render rich blocks ---
  const blocks = isStreaming ? [{ type: "text" as const, content: text }] : parseBlocks(text);

  return (
    <div className={`flex justify-start ${fullPage ? "mb-6" : "mb-4"}`}>
      <div
        className={`rounded-2xl rounded-bl-sm border border-border-default bg-white shadow-sm ${
          fullPage ? "max-w-[75%] px-5 py-4" : "max-w-[84%] px-4 py-3"
        }`}
      >
        {fullPage && (
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Mentor
            </p>
          </div>
        )}

        {blocks.map((block, idx) => {
          switch (block.type) {
            case "action_link":
              return <ActionLinkCard key={idx} url={block.content} fullPage={fullPage} />;
            case "concept":
              return <ConceptCard key={idx} content={block.content} fullPage={fullPage} />;
            case "mcq":
              return (
                <MCQCard
                  key={idx}
                  content={block.content}
                  onSelect={(opt) => onOptionSelect?.(`q${idx}`, opt)}
                  fullPage={fullPage}
                />
              );
            case "feedback_correct":
              return <FeedbackCard key={idx} content={block.content} correct={true} fullPage={fullPage} />;
            case "feedback_wrong":
              return <FeedbackCard key={idx} content={block.content} correct={false} fullPage={fullPage} />;
            case "text":
            default:
              return (
                <div
                  key={idx}
                  className={`leading-relaxed text-text-primary
                    [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5
                    [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-medium [&>strong]:font-bold
                    [&>blockquote]:border-l-2 [&>blockquote]:border-brand-accent/30 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-text-secondary
                    ${fullPage ? "text-[15px] [&>h2]:text-lg [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-base [&>h3]:mt-3" : "text-[14px]"}
                  `}
                >
                  <ReactMarkdown>{block.content}</ReactMarkdown>
                </div>
              );
          }
        })}

        {isStreaming && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-2 h-4 bg-brand-accent/60 rounded-sm ml-0.5 align-text-bottom"
          />
        )}

        {timestamp && !fullPage && (
          <p className="mt-2 text-[10px] text-text-muted">
            {new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}
