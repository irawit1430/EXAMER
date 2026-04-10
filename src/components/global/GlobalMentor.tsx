"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useMentorStore } from "@/store/useMentorStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { X, Minimize2, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

function formatMentorTime(timestamp: number): string {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export default function GlobalMentor() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const {
    isExpanded,
    isPulsing,
    currentDialogue,
    dialogueHistory,
    isStreaming,
    toggleExpanded,
    dismissMentor,
    addUserMessage,
  } = useMentorStore();

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
    if (isMuted || !synthRef.current) return;
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

      // Optionally, select a good voice
      const voices = synthRef.current.getVoices();
      const englishVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") || v.name.includes("Female")),
      );
      if (englishVoice) utterance.voice = englishVoice;

      synthRef.current.cancel(); // Stop current
      synthRef.current.speak(utterance);
    }
  }, [dialogueHistory, isMuted]);

  // Cleanup on unmount or mute
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

    if (synthRef.current) synthRef.current.cancel(); // Stop talking when user interrupts

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          useMentorStore.getState().finishStreaming();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            let dataStr = line.replace("data: ", "").trim();
            // Special fix for multiple json payloads in one chunk without newline
            if (dataStr.includes("}{")) {
              dataStr = dataStr.replace(/}{/g, "}\n{");
              const splitData = dataStr.split("\n");
              for (let sd of splitData) {
                try {
                  const data = JSON.parse(sd);
                  if (data.type === "redirect" && data.route) {
                    router.push(data.route);
                    continue;
                  } else if (data.type === "text" && data.text) {
                    useMentorStore.getState().appendStreamChunk(data.text);
                  } else if (data.text) {
                    useMentorStore.getState().appendStreamChunk(data.text);
                  }
                } catch (e) {}
              }
              continue;
            }

            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "redirect" && data.route) {
                router.push(data.route);
                continue;
              } else if (data.type === "done") {
                // Handled by done block
              } else if (data.type === "text" && data.text) {
                useMentorStore.getState().appendStreamChunk(data.text);
              } else if (data.text) {
                useMentorStore.getState().appendStreamChunk(data.text);
              }
            } catch (e) {}
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll logic inside the messages container
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [dialogueHistory, currentDialogue]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-1rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="flex h-[min(620px,calc(100vh-5rem))] w-[min(420px,calc(100vw-1rem))] flex-col overflow-hidden rounded-[28px] border border-border-default bg-white/96 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:w-[420px]"
          >
            <div className="flex items-center justify-between border-b border-border-default bg-white px-5 py-4">
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
                    EXAMER Mentor
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
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${isStreaming ? "border-brand-accent/20 bg-brand-accent/5 text-brand-accent" : "border-border-subtle bg-surface-50 text-text-muted"}`}
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
                <button
                  type="button"
                  onClick={toggleExpanded}
                  className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface-100"
                  aria-label="Minimize mentor chat"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={dismissMentor}
                  className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface-100"
                  aria-label="Close mentor chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] px-4 py-4 scrollbar-hide sm:px-5 sm:py-5"
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {dialogueHistory.length === 0 && !isStreaming ? (
                <div className="flex h-full items-start justify-start py-2">
                  <div className="w-full max-w-sm rounded-[24px] border border-border-default bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
                      Conversation
                    </p>
                    <h4 className="mt-2 text-xl font-display font-bold text-text-primary">
                      Start a mentor exchange
                    </h4>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                      Ask for a quiz, a simpler explanation, or a plan for{" "}
                      {profile?.favoriteSubject ||
                        "the topic you are working on"}
                      .
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt.label}
                          type="button"
                          onClick={() => handleSend(prompt.prompt)}
                          className="rounded-full border border-border-default bg-surface-50 px-3 py-1.5 text-[11px] font-semibold text-text-primary transition-colors hover:border-brand-accent/30 hover:bg-white"
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {dialogueHistory.map((msg, i) => (
                    <motion.div
                      key={`${msg.timestamp}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[84%] rounded-2xl px-4 py-3 shadow-sm ${
                          msg.role === "user"
                            ? "rounded-br-sm bg-brand-primary text-white"
                            : "rounded-bl-sm border border-border-default bg-white text-text-primary"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${msg.role === "user" ? "text-white/70" : "text-text-muted"}`}
                        >
                          {msg.role === "user" ? "You" : "Mentor"}
                        </p>
                        <div className="mt-1 text-[14px] leading-6 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-medium [&>strong]:font-bold">
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-[84%] rounded-2xl rounded-bl-sm border border-border-default bg-white px-4 py-3 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                          Mentor
                        </p>
                        {currentDialogue && currentDialogue !== "..." ? (
                          <div className="mt-1 text-[14px] leading-6 text-text-primary [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-medium [&>strong]:font-bold">
                            <ReactMarkdown>{currentDialogue}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-surface-50 px-3 py-1 text-[12px] font-medium text-text-secondary">
                            <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
                            Thinking...
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-border-default bg-white p-4">
              {sendError && (
                <div
                  role="alert"
                  className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                >
                  {sendError}
                </div>
              )}

              <div className="rounded-[24px] border border-border-default bg-surface-50 p-3 shadow-sm">
                <textarea
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    if (sendError) setSendError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    dialogueHistory.length > 0
                      ? "Ask a follow-up, request a quiz, or explain what still feels unclear..."
                      : "Ask for a quiz, explanation, or study plan..."
                  }
                  rows={3}
                  className="min-h-24 w-full resize-none border-none bg-transparent text-sm leading-6 text-text-primary placeholder:text-text-muted focus:outline-none"
                  aria-label="Message the EXAMER mentor"
                />

                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-[11px] text-text-muted">
                    Enter to send. Shift+Enter for a new line.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!userInput.trim() || isStreaming}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message to mentor"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggleExpanded}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isExpanded ? "Close mentor chat" : "Open mentor chat"}
        className={`relative z-50 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_16px_40px_rgba(15,23,42,0.22)] transition-all duration-300 ${isExpanded ? "scale-75 opacity-0 pointer-events-none" : "bg-brand-primary"}`}
      >
        {(isPulsing || isStreaming) && !isExpanded && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border border-brand-accent/40"
              animate={{ scale: [1, 1.34, 1], opacity: [0.55, 0, 0.55] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-brand-primary/30"
              animate={{ scale: [1, 1.62, 1], opacity: [0.28, 0, 0.28] }}
              transition={{
                repeat: Infinity,
                duration: 2.4,
                ease: "easeInOut",
                delay: 0.2,
              }}
            />
          </>
        )}

        <Sparkles
          className={`w-7 h-7 ${isStreaming && !isExpanded ? "animate-pulse" : ""}`}
        />

        {isPulsing && !isExpanded && (
          <span className="absolute -top-10 left-1/2 w-max -translate-x-1/2 rounded-lg border border-border-default bg-white px-3 py-1 text-[10px] font-bold text-text-primary shadow-sm">
            New insight
          </span>
        )}
      </motion.button>
    </div>
  );
}
