import { create } from "zustand";
import type { MicroConcept, ConceptStatus } from "@/types";

interface StudyState {
  // Current study state
  currentConcept: MicroConcept | null;
  currentSubjectId: string | null;
  currentTopicId: string | null;

  // Study mode
  isReading: boolean;
  isRecalling: boolean;
  isFeynmanMode: boolean;

  // Timer
  timer: number; // seconds elapsed
  readingDuration: number; // target reading time in seconds (default 150s = 2.5min)
  isTimerRunning: boolean;

  // Session
  sessionActive: boolean;
  conceptsCompleted: string[];

  // Actions
  startStudySession: (
    concept: MicroConcept,
    subjectId: string,
    topicId: string,
  ) => void;
  switchToRecall: () => void;
  switchToFeynman: () => void;
  tickTimer: () => void;
  resetTimer: () => void;
  markConceptComplete: (conceptId: string) => void;
  endSession: () => void;
  setReadingDuration: (seconds: number) => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  currentConcept: null,
  currentSubjectId: null,
  currentTopicId: null,
  isReading: false,
  isRecalling: false,
  isFeynmanMode: false,
  timer: 0,
  readingDuration: 150,
  isTimerRunning: false,
  sessionActive: false,
  conceptsCompleted: [],

  startStudySession: (concept, subjectId, topicId) =>
    set({
      currentConcept: concept,
      currentSubjectId: subjectId,
      currentTopicId: topicId,
      isReading: true,
      isRecalling: false,
      isFeynmanMode: false,
      timer: 0,
      isTimerRunning: true,
      sessionActive: true,
    }),

  switchToRecall: () =>
    set({
      isReading: false,
      isRecalling: true,
      isFeynmanMode: false,
      timer: 0,
    }),

  switchToFeynman: () =>
    set({
      isReading: false,
      isRecalling: false,
      isFeynmanMode: true,
    }),

  tickTimer: () => {
    const state = get();
    const newTimer = state.timer + 1;
    set({ timer: newTimer });

    // Auto-switch to recall after reading duration
    if (state.isReading && newTimer >= state.readingDuration) {
      state.switchToRecall();
    }
  },

  resetTimer: () => set({ timer: 0 }),

  markConceptComplete: (conceptId) =>
    set((state) => ({
      conceptsCompleted: [...state.conceptsCompleted, conceptId],
    })),

  endSession: () =>
    set({
      currentConcept: null,
      currentSubjectId: null,
      currentTopicId: null,
      isReading: false,
      isRecalling: false,
      isFeynmanMode: false,
      timer: 0,
      isTimerRunning: false,
      sessionActive: false,
    }),

  setReadingDuration: (seconds) => set({ readingDuration: seconds }),
}));
