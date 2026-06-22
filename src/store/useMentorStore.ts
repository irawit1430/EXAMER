import { create } from "zustand";
import type { MentorTrigger } from "@/types";

interface MentorState {
  activeUserId: string | null;

  // Visibility
  isVisible: boolean;
  isExpanded: boolean;
  isPulsing: boolean; // indicator that AI wants to say something
  isFullPage: boolean; // true when on /mentor route

  // Dialogue
  currentDialogue: string;
  dialogueHistory: Array<{
    role: "mentor" | "user";
    text: string;
    timestamp: number;
  }>;

  // Session context (for sidebar)
  sessionContext: {
    currentTopic: string | null;
    sessionStartTime: number | null;
    messagesCount: number;
  };

  // Triggers
  interruptFlag: boolean;
  triggerReason: MentorTrigger | null;
  lastTriggerTime: number | null;

  // Streaming
  isStreaming: boolean;
  streamBuffer: string;

  // Actions
  triggerMentor: (reason: MentorTrigger, message: string) => void;
  startStreamingMentor: (reason: MentorTrigger) => void;
  dismissMentor: () => void;
  toggleExpanded: () => void;
  appendStreamChunk: (chunk: string) => void;
  finishStreaming: () => void;
  addUserMessage: (text: string) => void;
  clearHistory: () => void;
  setPulsing: (pulsing: boolean) => void;
  setActiveUser: (userId: string | null) => void;
  setFullPage: (isFullPage: boolean) => void;
  setCurrentTopic: (topic: string | null) => void;
}

export const useMentorStore = create<MentorState>((set, get) => ({
  activeUserId: null,
  isVisible: false,
  isExpanded: false,
  isPulsing: false,
  isFullPage: false,
  currentDialogue: "",
  dialogueHistory: [],
  sessionContext: {
    currentTopic: null,
    sessionStartTime: null,
    messagesCount: 0,
  },
  interruptFlag: false,
  triggerReason: null,
  lastTriggerTime: null,
  isStreaming: false,
  streamBuffer: "",

  triggerMentor: (reason, message) => {
    const state = get();
    const shouldRespectCooldown = reason !== "manual";

    // Don't interrupt if already showing and was triggered < 30s ago
    if (
      shouldRespectCooldown &&
      state.isVisible &&
      state.lastTriggerTime &&
      Date.now() - state.lastTriggerTime < 30000
    ) {
      return;
    }

    set({
      isVisible: true,
      isExpanded: true,
      isPulsing: false,
      currentDialogue: message,
      interruptFlag: true,
      triggerReason: reason,
      lastTriggerTime: Date.now(),
      dialogueHistory: [
        ...state.dialogueHistory,
        { role: "mentor", text: message, timestamp: Date.now() },
      ],
    });
  },

  startStreamingMentor: (reason) => {
    const state = get();
    const shouldRespectCooldown = reason !== "manual";

    if (
      shouldRespectCooldown &&
      state.isVisible &&
      state.lastTriggerTime &&
      Date.now() - state.lastTriggerTime < 30000
    ) {
      return;
    }

    set({
      isVisible: true,
      isExpanded: true,
      isPulsing: false,
      currentDialogue: "...",
      interruptFlag: true,
      triggerReason: reason,
      lastTriggerTime: Date.now(),
      isStreaming: true,
      streamBuffer: "",
    });
  },

  dismissMentor: () =>
    set({
      isExpanded: false,
      interruptFlag: false,
      isStreaming: false,
      streamBuffer: "",
    }),

  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),

  appendStreamChunk: (chunk) =>
    set((state) => {
      const newBuffer = state.streamBuffer + chunk;
      return {
        streamBuffer: newBuffer,
        currentDialogue: newBuffer, // Overwrite current dialogue with the mounting buffer
      };
    }),

  finishStreaming: () => {
    const state = get();
    const completedText = state.streamBuffer.trim();
    set({
      isStreaming: false,
      interruptFlag: false,
      triggerReason: null,
      currentDialogue: "",
      dialogueHistory: completedText
        ? [
            ...state.dialogueHistory,
            { role: "mentor", text: completedText, timestamp: Date.now() },
          ]
        : state.dialogueHistory,
      streamBuffer: "",
    });
  },

  addUserMessage: (text) =>
    set((state) => ({
      dialogueHistory: [
        ...state.dialogueHistory,
        { role: "user", text, timestamp: Date.now() },
      ],
    })),

  clearHistory: () =>
    set({
      dialogueHistory: [],
      currentDialogue: "",
      streamBuffer: "",
      isStreaming: false,
      isVisible: false,
      isExpanded: false,
      isPulsing: false,
      triggerReason: null,
      interruptFlag: false,
      lastTriggerTime: null,
    }),

  setPulsing: (pulsing) => set({ isPulsing: pulsing }),

  setFullPage: (isFullPage) => {
    set({
      isFullPage,
      // When entering full-page, ensure visibility
      ...(isFullPage ? { isVisible: true, isExpanded: true } : {}),
      // Start session timer if entering full page for first time
      ...(isFullPage && !get().sessionContext.sessionStartTime
        ? {
            sessionContext: {
              ...get().sessionContext,
              sessionStartTime: Date.now(),
            },
          }
        : {}),
    });
  },

  setCurrentTopic: (topic) =>
    set((state) => ({
      sessionContext: { ...state.sessionContext, currentTopic: topic },
    })),

  setActiveUser: (userId) => {
    const state = get();
    if (state.activeUserId === userId) return;

    set({
      activeUserId: userId,
      dialogueHistory: [],
      currentDialogue: "",
      streamBuffer: "",
      isStreaming: false,
      isVisible: false,
      isExpanded: false,
      isPulsing: false,
      isFullPage: false,
      triggerReason: null,
      interruptFlag: false,
      lastTriggerTime: null,
      sessionContext: {
        currentTopic: null,
        sessionStartTime: null,
        messagesCount: 0,
      },
    });
  },
}));
