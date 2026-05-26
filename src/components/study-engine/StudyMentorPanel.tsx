"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useMentorStore } from "@/store/useMentorStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

function formatMentorTime(timestamp: number): string {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export default function StudyMentorPanel() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);

  // ⚡ Bolt: Using atomic selectors instead of destructuring the entire store
  // Prevents full component re-renders when other unused state properties update
  const currentDialogue = useMentorStore((s) => s.currentDialogue);
  const dialogueHistory = useMentorStore((s) => s.dialogueHistory);
  const isStreaming = useMentorStore((s) => s.isStreaming);
  const addUserMessage = useMentorStore((s) => s.addUserMessage);

  const [userInput, setUserInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const quickPrompts = useMemo(() => {
    const favoriteSubject = profile?.favoriteSubject || "this subject";

    return [
      {
        label: "Quick quiz",
        prompt: `Quiz me on ${favoriteSubject} with 3 short questions.`,
      },
      {
        label: "Explain simply",
        prompt:
          "Explain the current topic in simple words, then ask me one check question.",
      },
      {
        label: "Fix mistakes",
        prompt:
          "I keep forgetting key ideas. Help me review the main gaps and give me a short drill.",
      },
    ];
  }, [profile?.favoriteSubject]);

  // TTS State
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const latestSpokenText = useRef("");

  // Setup Speech Synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // Effect to speak current dialogue when streaming finishes or updates
  useEffect(() => {
    if (isMuted || !synthRef.current || isStreaming) return;
    const lastMsg = dialogueHistory[dialogueHistory.length - 1];
    if (
      lastMsg &&
      lastMsg.role === "mentor" &&
      lastMsg.text !== latestSpokenText.current
    ) {
      latestSpokenText.current = lastMsg.text;
      const utterance = new SpeechSynthesisUtterance(lastMsg.text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = synthRef.current.getVoices();
      const englishVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") || v.name.includes("Female")),
      );
      if (englishVoice) utterance.voice = englishVoice;

      synthRef.current.cancel(); 
      synthRef.current.speak(utterance);
    }
  }, [dialogueHistory, isMuted, isStreaming]);

  useEffect(() => {
    if (isMuted && synthRef.current) {
      synthRef.current.cancel();
    }
  }, [isMuted]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText ?? userInput).trim();
    if (!textToSend || isStreaming) return;

    setSendError(null);
    const userId = user?.uid || profile?.uid;
    if (!userId) {
      setSendError("Sign in again to continue the conversation.");
      return;
    }

    addUserMessage(textToSend);
    setUserInput("");

    if (synthRef.current) synthRef.current.cancel(); 

    try {
      const store = useMentorStore.getState();
      store.startStreamingMentor("manual");

      const idToken = user ? await user.getIdToken() : null;
      const sessionId = `session_${userId}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-id": userId,
      };

      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }

      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, sessionId, message: textToSend }),
      });

      if (!response.ok || !response.body) {
        throw new Error("The mentor service is temporarily unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          useMentorStore.getState().finishStreaming();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === "redirect" && data.route) {
                router.push(data.route);
              } else if (data.type === "done") {
                // Handled
              } else if (data.type === "text" && data.text) {
                useMentorStore.getState().appendStreamChunk(data.text);
              } else if (data.text) {
                useMentorStore.getState().appendStreamChunk(data.text);
              }
            } catch (e) {
              console.error("Failed to parse stream chunk:", dataStr, e);
            }
          }
        }
      }
    } catch {
      setSendError(
        "Could not reach the mentor right now. Try again in a moment.",
      );
      useMentorStore.getState().finishStreaming();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      e.currentTarget.style.height = "52px";
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [dialogueHistory, currentDialogue, isStreaming]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-border-subtle bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-border-subtle bg-white/70 backdrop-blur-md px-5 py-4 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
            {isStreaming && (
              <motion.div
                className="absolute inset-0 rounded-2xl border border-brand-accent/25"
                animate={{ scale: [1, 1.16, 1], opacity: [0.9, 0, 0.9] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              AI Tutor
            </h3>
            <p className="text-[11px] font-medium text-text-secondary">
              {isStreaming
                ? "Typing a response"
                : dialogueHistory.length > 0
                  ? "Ready for a follow-up"
                  : "Ask for a quiz or explanation"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${isStreaming ? "border-brand-accent/20 bg-brand-accent/5 text-brand-accent" : "border-border-subtle bg-white text-text-muted"}`}
          >
            {isStreaming ? "Thinking" : "Live"}
          </span>
          <button
            type="button"
            onClick={() => setIsMuted((value) => !value)}
            className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface-100"
            aria-label={
              isMuted ? "Unmute mentor voice" : "Mute mentor voice"
            }
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-brand-accent" />
            )}
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_100%)] p-4 sm:p-6 scrollbar-hide flex flex-col"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {dialogueHistory.length === 0 && !isStreaming ? (
          <div className="flex flex-1 items-center justify-center py-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm rounded-2xl border border-border-default bg-surface-50 p-6 sm:p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-primary/60">
                Conversation
              </p>
              <h4 className="mt-2 text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
                Start a mentor exchange
              </h4>
              <p className="mt-3 text-[14px] leading-6 text-text-secondary px-2">
                Ask for a quiz, a simpler explanation, or a plan for{" "}
                <span className="font-semibold text-text-primary">{profile?.favoriteSubject || "the current topic"}</span>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {quickPrompts.map((prompt, index) => (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.05, duration: 0.3 }}
                    key={prompt.label}
                    type="button"
                    onClick={() => handleSend(prompt.prompt)}
                    className="rounded-full border border-border-default bg-white px-4 py-2 text-[12px] font-semibold text-text-primary transition-all duration-200 hover:border-brand-primary/40 hover:bg-surface-50 hover:text-brand-primary"
                  >
                    {prompt.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {dialogueHistory.map((msg, i) => (
                <motion.div
                  key={`${msg.timestamp}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[84%] rounded-xl px-5 py-4 ${
                      msg.role === "user"
                        ? "rounded-tr-[4px] bg-brand-primary text-white text-right"
                        : "rounded-tl-[4px] border border-border-default bg-white text-text-primary text-left"
                    }`}
                  >
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${msg.role === "user" ? "text-white/70" : "text-text-muted"}`}
                    >
                      {msg.role === "user" ? "You" : "Mentor"}
                    </p>
                    <div className="mt-1 text-[14px] leading-6 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-medium [&>strong]:font-bold text-left inline-block">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                    <p
                      className={`mt-2 text-[10px] ${msg.role === "user" ? "text-white/60" : "text-text-muted"}`}
                    >
                      {formatMentorTime(msg.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isStreaming && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="flex w-full justify-start mt-2"
                >
                  <div className="max-w-[84%] rounded-xl rounded-tl-[4px] border border-border-default bg-white px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Mentor
                    </p>
                    {currentDialogue && currentDialogue !== "..." ? (
                      <div className="mt-1 text-[14px] leading-6 text-text-primary [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-medium [&>strong]:font-bold">
                        <ReactMarkdown>{currentDialogue}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center h-[24px] gap-1.5 px-1 w-fit">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </div>

      <div className="border-t border-border-subtle bg-white/80 backdrop-blur-sm p-4 sm:p-5">
        {sendError && (
          <div className="mb-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {sendError}
          </div>
        )}
        <div className="relative flex items-end gap-2">
          <textarea
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              e.target.style.height = "52px";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI tutor..."
            aria-label="Type your message to the AI tutor"
            rows={1}
            disabled={isStreaming}
            className="flex-1 w-full resize-none rounded-xl border border-border-default bg-white py-3.5 pl-5 pr-5 text-[14px] text-text-primary transition-all focus:border-brand-primary focus:bg-white focus:outline-none disabled:opacity-50"
            style={{ minHeight: "52px", maxHeight: "120px" }}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!userInput.trim() || isStreaming}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-brand-primary text-white transition-all hover:bg-brand-primary/90 disabled:pointer-events-none disabled:opacity-50 flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">
          AI can make mistakes. Verify important facts.
        </p>
      </div>
    </motion.div>
  );
}