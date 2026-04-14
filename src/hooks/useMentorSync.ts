"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useMetricsStore } from "@/store/useMetricsStore";
import { useStudyStore } from "@/store/useStudyStore";
import { useMentorStore } from "@/store/useMentorStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getMentorMemory } from "@/lib/firebase/firestore";
import type { AIContextPayload, MentorTrigger, MentorMemory } from "@/types";

/**
 * useMentorSync — The AI Mentor's "brain" hook
 *
 * Subscribes to Zustand stores and triggers AI interventions based on:
 * 1. Idle detection (> 5 min on a concept)
 * 2. Consecutive errors (≥ 2 in a row)
 * 3. High speed + high accuracy (praise)
 * 4. Periodic context injection (every 60s)
 */

interface MentorSyncConfig {
  idleThresholdSeconds?: number;
  errorThreshold?: number;
  contextIntervalSeconds?: number;
  speedThreshold?: number; // QPM below this = slow
  highSpeedThreshold?: number; // QPM above this = fast
  accuracyThreshold?: number; // % above this + fast speed = praise
  daysToExam?: number;
  predictedScore?: number;
  streakDays?: number;
}

const DEFAULT_CONFIG: Required<MentorSyncConfig> = {
  idleThresholdSeconds: 300, // 5 minutes
  errorThreshold: 2,
  contextIntervalSeconds: 60,
  speedThreshold: 0.8,
  highSpeedThreshold: 2.5,
  accuracyThreshold: 85,
  daysToExam: 40,
  predictedScore: 245,
  streakDays: 5,
};

// Decision messages — these will be replaced by Gemini streaming responses when API key is set
const DECISION_MESSAGES: Record<string, string[]> = {
  idle: [
    "Are we studying or daydreaming? The exam is {days} days away. Let's do a quick active recall.",
    "You've been staring at this for {time}. Stop reading and start DOING. Switch to recall mode.",
    "Time check: {time} on one concept. If you can't explain it by now, you don't understand it. Feynman mode. Now.",
  ],
  errors: [
    "You're rushing. You made {count} errors in a row. Slow down, read the question properly.",
    "Two wrong in a row. This isn't about speed — it's about accuracy. Let's break this concept down step by step.",
    "{count} consecutive mistakes. Your predicted score just took a hit. Focus. What part aren't you getting?",
  ],
  high_speed: [
    "Savage speed. {qpm} QPM with {accuracy}% accuracy. Pushing you to harder difficulty next.",
    "You're on fire 🔥 {accuracy}% accuracy at {qpm} QPM. Let's see if Level 3 slows you down.",
    "Speed demon mode activated. Keep this up and your predicted score is heading to {score}+.",
  ],
  session_start: [
    "Let's go. {days} days to the exam. Your predicted score is {score}/300. Every concept counts.",
    "Welcome back. Your streak is {streak} days strong. Don't break it.",
  ],
};

function pickMessage(
  category: string,
  vars: Record<string, string | number>,
): string {
  const messages = DECISION_MESSAGES[category] || DECISION_MESSAGES.idle;
  const template = messages[Math.floor(Math.random() * messages.length)];
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] || key));
}

// Helper to format date
function formatDate(d: any): string {
  if (!d) return "Unknown";
  if (d instanceof Date) return d.toLocaleDateString();
  if (typeof d?.toDate === "function") return d.toDate().toLocaleDateString();
  if (typeof d?.seconds === "number")
    return new Date(d.seconds * 1000).toLocaleDateString();
  return new Date(d).toLocaleDateString();
}

function buildContextPayload(
  studyStore: ReturnType<typeof useStudyStore.getState>,
  metricsStore: ReturnType<typeof useMetricsStore.getState>,
  profile: ReturnType<typeof useAuthStore.getState>["profile"],
  mentorMemory: MentorMemory | null,
  config: Required<MentorSyncConfig>,
): AIContextPayload {
  const minutes = Math.floor(studyStore.timer / 60);
  const seconds = studyStore.timer % 60;

  // Dynamic Predicted Score Calculation: (correct*4) - (incorrect*1)
  // If no questions attempted yet, default to their targetScore or 245
  const computedScore =
    metricsStore.questionsAttempted > 0
      ? metricsStore.correctCount * 4 - metricsStore.incorrectCount * 1
      : profile?.targetScore || config.predictedScore;

  return {
    currentState: studyStore.isReading
      ? "Reading"
      : studyStore.isRecalling
        ? "Active Recall"
        : studyStore.isFeynmanMode
          ? "Feynman Mode"
          : "Idle",
    currentTopic: studyStore.currentConcept?.name || "None",
    timeSpent: `${minutes}m ${seconds}s`,
    recentErrors: metricsStore.consecutiveErrors,
    streak: config.streakDays,
    predictedScore: computedScore,
    daysToExam: config.daysToExam,
    weaknesses: mentorMemory?.identifiedWeaknesses || [],

    // ---- The "Soul" properties ----
    joinDate: formatDate(profile?.createdAt),
    targetScore: profile?.targetScore || 300,
    prepLevel: profile?.prepLevel || "Unknown",
    favoriteSubject: profile?.favoriteSubject || "Unknown",
    importantMemories: mentorMemory?.importantMemories || [],
  };
}

export function useMentorSync(config: MentorSyncConfig = {}) {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [mentorMemory, setMentorMemory] = useState<MentorMemory | null>(null);

  // Fetch mentor memory on mount
  useEffect(() => {
    if (profile?.uid) {
      getMentorMemory(profile.uid).then((mem) => setMentorMemory(mem));
    } else {
      setMentorMemory(null);
    }
  }, [profile?.uid]);

  // Dynamically calculate daysToExam from the user's profile examDate
  const computedDaysToExam = useMemo(() => {
    const d = profile?.examDate;
    if (!d) return 0;
    let examDate: Date | null = null;
    if (d instanceof Date) examDate = d;
    else if (typeof (d as any)?.toDate === "function")
      examDate = (d as any).toDate();
    else if (typeof (d as any)?.seconds === "number")
      examDate = new Date((d as any).seconds * 1000);
    else {
      const parsed = new Date(d as any);
      examDate = isNaN(parsed.getTime()) ? null : parsed;
    }
    if (!examDate) return 0;
    return Math.max(
      0,
      Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
  }, [profile?.examDate]);

  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    daysToExam: config.daysToExam ?? computedDaysToExam,
  };
  const lastContextSendRef = useRef<number>(0);
  const lastIdleCheckRef = useRef<number>(0);

  const triggerMentor = useMentorStore((s) => s.triggerMentor);
  const setPulsing = useMentorStore((s) => s.setPulsing);
  const mentorVisible = useMentorStore((s) => s.isVisible);

  // ---- Decision Engine ----
  const evaluateState = useCallback(async () => {
    const study = useStudyStore.getState();
    const metrics = useMetricsStore.getState();
    const mentor = useMentorStore.getState();

    // Don't interrupt if mentor is already showing
    if (mentor.isExpanded) return;

    const now = Date.now();

    // 1. IDLE DETECTION: > threshold seconds on one concept
    if (
      study.sessionActive &&
      study.timer > mergedConfig.idleThresholdSeconds &&
      now - lastIdleCheckRef.current > 60000 // don't spam idle checks
    ) {
      lastIdleCheckRef.current = now;
      const minutes = Math.floor(study.timer / 60);

      // Start streaming UI
      const context = buildContextPayload(
        study,
        metrics,
        profile,
        mentorMemory,
        mergedConfig,
      );
      const effectiveUserId = user?.uid || profile?.uid;
      if (!effectiveUserId) return;
      const sessionId = `session_${effectiveUserId}`;
      const success = await streamMentorResponse(
        effectiveUserId,
        sessionId,
        context,
        "idle",
      );

      if (!success) {
        // Fallback to templated message if API fails
        triggerMentor(
          "idle",
          pickMessage("idle", {
            days: mergedConfig.daysToExam,
            time: `${minutes} minutes`,
          }),
        );
      }
      return;
    }

    // 2. CONSECUTIVE ERRORS: ≥ threshold
    if (metrics.consecutiveErrors >= mergedConfig.errorThreshold) {
      const context = buildContextPayload(
        study,
        metrics,
        profile,
        mentorMemory,
        mergedConfig,
      );
      const effectiveUserId = user?.uid || profile?.uid;
      if (!effectiveUserId) return;
      const sessionId = `session_${effectiveUserId}`;
      const success = await streamMentorResponse(
        effectiveUserId,
        sessionId,
        context,
        "errors",
      );

      if (!success) {
        triggerMentor(
          "errors",
          pickMessage("errors", { count: metrics.consecutiveErrors }),
        );
      }
      return;
    }

    // 3. HIGH SPEED + HIGH ACCURACY: praise
    if (
      metrics.speed >= mergedConfig.highSpeedThreshold &&
      metrics.questionsAttempted >= 3
    ) {
      const accuracy =
        metrics.questionsAttempted > 0
          ? (metrics.correctCount / metrics.questionsAttempted) * 100
          : 0;

      if (accuracy >= mergedConfig.accuracyThreshold) {
        triggerMentor(
          "high_speed",
          pickMessage("high_speed", {
            qpm: metrics.speed.toFixed(1),
            accuracy: accuracy.toFixed(0),
            score: mergedConfig.predictedScore + 15,
          }),
        );
        return;
      }
    }

    // 4. Soft pulsing indicator when mentor wants to speak (but doesn't interrupt)
    if (
      study.sessionActive &&
      study.timer > 120 && // 2 minutes into a concept
      metrics.questionsAttempted === 0 && // haven't tested yet
      !mentor.isPulsing
    ) {
      setPulsing(true);
    }
  }, [
    mergedConfig,
    triggerMentor,
    setPulsing,
    user?.uid,
    profile?.uid,
    profile,
    mentorMemory,
  ]);

  // ---- Periodic context injection (every 60s) ----
  useEffect(() => {
    const interval = setInterval(() => {
      const study = useStudyStore.getState();
      if (!study.sessionActive) return;

      const now = Date.now();
      if (
        now - lastContextSendRef.current <
        mergedConfig.contextIntervalSeconds * 1000
      )
        return;
      lastContextSendRef.current = now;

      evaluateState();
    }, 10000); // Check every 10 seconds, but only act every 60s

    return () => clearInterval(interval);
  }, [evaluateState, mergedConfig.contextIntervalSeconds]);

  // ---- React to consecutive errors immediately ----
  useEffect(() => {
    const unsubscribe = useMetricsStore.subscribe((state, prevState) => {
      if (
        state.consecutiveErrors >= mergedConfig.errorThreshold &&
        prevState.consecutiveErrors < mergedConfig.errorThreshold
      ) {
        evaluateState();
      }
    });
    return unsubscribe;
  }, [evaluateState, mergedConfig.errorThreshold]);

  // ---- Session start greeting ----
  const triggerSessionStart = useCallback(() => {
    triggerMentor(
      "session_start",
      pickMessage("session_start", {
        days: mergedConfig.daysToExam,
        score: mergedConfig.predictedScore,
        streak: mergedConfig.streakDays,
      }),
    );
  }, [triggerMentor, mergedConfig]);

  return {
    evaluateState,
    triggerSessionStart,
    buildContextPayload: () =>
      buildContextPayload(
        useStudyStore.getState(),
        useMetricsStore.getState(),
        profile,
        mentorMemory,
        mergedConfig,
      ),
  };
}

// ---- Stream AI-generated mentor response via Edge API directly to store ----
export async function streamMentorResponse(
  userId: string,
  sessionId: string,
  context: AIContextPayload,
  trigger: string,
): Promise<boolean> {
  const store = useMentorStore.getState();
  store.startStreamingMentor(trigger as MentorTrigger);

  try {
    const authUser = useAuthStore.getState().user;
    const idToken = authUser ? await authUser.getIdToken() : null;

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
      body: JSON.stringify({ userId, sessionId, context, trigger }),
    });

    if (!response.ok || !response.body) throw new Error("API Error");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        store.finishStreaming();
        return true;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "").trim();
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.type === "done") {
              // Handled by done block
            } else if (data.type === "text" && data.text) {
              // Update Zustand store chunk
              useMentorStore.getState().appendStreamChunk(data.text);
            } else if (
              data.type === "tool_result" ||
              data.type === "tool_call"
            ) {
              // We can log or visually indicate tool usage if we want
            } else if (data.text) {
              // Fallback for older format
              useMentorStore.getState().appendStreamChunk(data.text);
            }
          } catch (e) {
            // pass parse errors for split chunks
          }
        }
      }
    }
  } catch {
    // API not configured or network error — revert streaming state
    store.finishStreaming();
    return false;
  }
}
