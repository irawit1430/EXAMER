import { create } from "zustand";

interface MetricsState {
  // Session metrics
  questionsAttempted: number;
  correctCount: number;
  incorrectCount: number;
  currentSessionErrors: number;
  consecutiveErrors: number;

  // Speed tracking
  speed: number; // questions per minute
  avgSecondsPerQuestion: number;
  questionStartTime: number | null;
  questionTimes: number[]; // individual question times in seconds

  // Session info
  sessionStartTime: number | null;

  // Actions
  startSession: () => void;
  startQuestion: () => void;
  recordAnswer: (correct: boolean) => void;
  resetSession: () => void;
  getSpeedCategory: () => "slow" | "normal" | "fast";
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  questionsAttempted: 0,
  correctCount: 0,
  incorrectCount: 0,
  currentSessionErrors: 0,
  consecutiveErrors: 0,
  speed: 0,
  avgSecondsPerQuestion: 0,
  questionStartTime: null,
  questionTimes: [],
  sessionStartTime: null,

  startSession: () =>
    set({
      questionsAttempted: 0,
      correctCount: 0,
      incorrectCount: 0,
      currentSessionErrors: 0,
      consecutiveErrors: 0,
      speed: 0,
      avgSecondsPerQuestion: 0,
      questionStartTime: null,
      questionTimes: [],
      sessionStartTime: Date.now(),
    }),

  startQuestion: () => set({ questionStartTime: Date.now() }),

  recordAnswer: (correct) => {
    const state = get();
    const now = Date.now();
    const questionTime = state.questionStartTime
      ? (now - state.questionStartTime) / 1000
      : 0;

    const newQuestionTimes = [...state.questionTimes, questionTime];
    const newAttempted = state.questionsAttempted + 1;
    const newCorrect = correct ? state.correctCount + 1 : state.correctCount;
    const newIncorrect = correct
      ? state.incorrectCount
      : state.incorrectCount + 1;
    const newSessionErrors = correct
      ? state.currentSessionErrors
      : state.currentSessionErrors + 1;
    const newConsecutiveErrors = correct ? 0 : state.consecutiveErrors + 1;

    // Calculate speed (questions per minute)
    const totalTime = newQuestionTimes.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / newQuestionTimes.length;
    const qpm = avgTime > 0 ? 60 / avgTime : 0;

    set({
      questionsAttempted: newAttempted,
      correctCount: newCorrect,
      incorrectCount: newIncorrect,
      currentSessionErrors: newSessionErrors,
      consecutiveErrors: newConsecutiveErrors,
      questionTimes: newQuestionTimes,
      speed: Math.round(qpm * 100) / 100,
      avgSecondsPerQuestion: Math.round(avgTime),
      questionStartTime: null,
    });
  },

  resetSession: () =>
    set({
      questionsAttempted: 0,
      correctCount: 0,
      incorrectCount: 0,
      currentSessionErrors: 0,
      consecutiveErrors: 0,
      speed: 0,
      avgSecondsPerQuestion: 0,
      questionStartTime: null,
      questionTimes: [],
      sessionStartTime: null,
    }),

  getSpeedCategory: () => {
    const { avgSecondsPerQuestion } = get();
    if (avgSecondsPerQuestion === 0) return "normal";
    if (avgSecondsPerQuestion > 72) return "slow"; // > 1.2 min
    if (avgSecondsPerQuestion < 40) return "fast";
    return "normal";
  },
}));
