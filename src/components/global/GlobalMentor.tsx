"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useMentorStore } from "@/store/useMentorStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { X, Minimize2, Maximize2, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

// ⚡ Bolt Optimization:
// Extracted inline message rendering into a memoized ChatMessage component.
// Why: Prevents unnecessary re-renders of the entire message history
//      every time a new chunk arrives during streaming, saving CPU cycles.
const ChatMessage = React.memo(({ msg }: { msg: { role: "mentor" | "user"; text: string; timestamp: number } }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9, y: 10 }}
    transition={{ type: "spring", stiffness: 300, damping: 24 }}
    className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
  >
    <div
      className={`max-w-[84%] rounded-3xl px-5 py-4 shadow-sm ${
        msg.role === "user"
          ? "rounded-tr-[4px] bg-brand-primary text-white text-right"
          : "rounded-tl-[4px] border border-border-subtle bg-white text-text-primary text-left"
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
));
ChatMessage.displayName = "ChatMessage";


function formatMentorTime(timestamp: number): string {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export default function GlobalMentor() {
  const router = useRouter();
  const pathname = usePathname();
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
  const [isTall, setIsTall] = useState(false);

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
              for (const sd of splitData) {
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
      // Optimizized scroll rendering: let the browser handle it in the next paint cycle to avoid jank
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [dialogueHistory, currentDialogue, isStreaming]);

  // Keep the component mounted and hide via CSS on study pages for smoother route transitions
  const isHidden = pathname?.includes("/study");

  return (
    <div className={`flex flex-col items-end gap-4 pointer-events-none ${isHidden ? "hidden" : ""}`}>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="flex w-[min(420px,calc(100vw-1rem))] flex-col overflow-hidden rounded-[28px] border border-border-subtle bg-white/96 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:w-[420px] pointer-events-auto"
            style={{
              height: isTall ? "calc(100vh - 5rem)" : "min(620px, calc(100vh - 5rem))",
              transition: "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <div className="flex items-center justify-between border-b border-border-subtle bg-white/70 backdrop-blur-md px-5 py-4 z-10 relative">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-sm shrink-0">
                  <Sparkles className="w-4 h-4" />
                  {isStreaming && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border border-brand-accent/25"
                      animate={{ scale: [1, 1.16, 1], opacity: [0.9, 0, 0.9] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </div>
                <div className="select-none flex-1">
                  <h3 className="text-sm font-bold text-text-primary">EXAMER Mentor</h3>
                  <p className="text-[11px] font-medium text-text-secondary truncate max-w-[120px] sm:max-w-[160px]">
                    {isStreaming
                      ? "Typing a response"
                      : dialogueHistory.length > 0
                        ? "Ready for a follow-up"
                        : "Ask for a quiz or explanation"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <span
                  className={`hidden sm:inline-block rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] select-none ${isStreaming ? "border-brand-accent/20 bg-brand-accent/5 text-brand-accent" : "border-border-subtle bg-surface-50 text-text-muted"}`}
                >
                  {isStreaming ? "Thinking" : "Live"}
                </span>
                
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsTall(!isTall); }}
                    className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface-100"
                    aria-label={isTall ? "Shrink mentor chat" : "Expand mentor chat height"}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {isTall ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsMuted((value) => !value); }}
                    className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface-100"
                    aria-label={
                      isMuted ? "Unmute mentor voice" : "Mute mentor voice"
                    }
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-brand-accent" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
                    className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface-100"
                    aria-label="Minimize mentor chat"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_100%)] px-4 py-4 scrollbar-hide sm:px-5 sm:py-5 flex flex-col relative z-0"
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
                    className="w-full max-w-sm rounded-[32px] border border-border-default/50 bg-gradient-to-b from-white to-surface-50 p-6 sm:p-8 shadow-xl shadow-brand-primary/5 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-primary/60">
                      Conversation
                    </p>
                    <h4 className="mt-2 text-xl font-display font-bold text-text-primary tracking-tight">
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
                          className="rounded-full border border-border-default/80 bg-white px-4 py-2 text-[12px] font-semibold text-text-primary transition-all duration-200 hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-primary active:scale-95 shadow-sm"
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
                      <ChatMessage key={`${msg.timestamp}-${i}`} msg={msg} />
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
                        <div className="max-w-[84%] rounded-3xl rounded-tl-[4px] border border-border-subtle bg-white px-5 py-4 shadow-sm">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                            Mentor
                          </p>
                          {currentDialogue && currentDialogue !== "..." ? (
                            <div className="mt-1 text-[14px] leading-6 text-text-primary [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-medium [&>strong]:font-bold text-left inline-block">
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

            <div className="border-t border-border-subtle bg-white/80 backdrop-blur-sm p-4 relative z-10">
              {sendError && (
                <div
                  role="alert"
                  className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                >
                  {sendError}
                </div>
              )}

              <div className="rounded-3xl border border-border-default/80 bg-white p-3 shadow-sm focus-within:border-brand-primary/50 focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all">
                <textarea
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    if (sendError) setSendError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    dialogueHistory.length > 0
                      ? "Ask a follow-up, request a quiz..."
                      : "Ask for a quiz, explanation..."
                  }
                  rows={3}
                  className="min-h-16 w-full resize-none border-none bg-transparent text-[14px] leading-6 text-text-primary px-2 placeholder:text-text-muted focus:outline-none"
                  aria-label="Message the EXAMER mentor"
                />

                <div className="mt-2 flex items-end justify-between gap-3 px-2 pb-1">
                  <p className="text-[11px] text-text-muted">
                    Enter to send. <span className="hidden sm:inline">Shift+Enter for a new line.</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!userInput.trim() || isStreaming}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 hover:shadow-lg hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 active:scale-95"
                    aria-label="Send message to mentor"
                  >
                    <Send className="w-4 h-4 ml-[-2px]" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layout
        type="button"
        onClick={toggleExpanded}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isExpanded ? "Close mentor chat" : "Open mentor chat"}
        className={`relative z-50 flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full text-white shadow-[0_16px_40px_rgba(15,23,42,0.22)] transition-all duration-300 pointer-events-auto ${isExpanded ? "scale-75 opacity-0 pointer-events-none" : "bg-brand-primary"}`}
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
          <span className="absolute -top-10 left-1/2 w-max -translate-x-1/2 rounded-lg border border-border-default bg-white px-3 py-1 text-[10px] font-bold text-text-primary shadow-sm pointer-events-none">
            New insight
          </span>
        )}
      </motion.button>
    </div>
  );
}
