// ==========================================
// EXAMER — Core TypeScript Type Definitions
// ==========================================

// ---- Enums ----
export type ConceptStatus = "new" | "learning" | "review_24h" | "mastered";
export type MentorTrigger =
  | "idle"
  | "errors"
  | "high_speed"
  | "manual"
  | "session_start";
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

// ---- Firestore: users Collection ----
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  examDate: Date;
  predictedScore: number;
  streak: {
    current: number;
    longest: number;
    lastActive: Date;
  };
  whatsappOptIn: boolean;
  whatsappNumber?: string;
  targetScore: number;
  createdAt: Date;
  onboardingComplete: boolean;
  // Onboarding additional fields
  syllabus?: string;
  favoriteSubject?: string;
  dailyStudyTime?: string;
  prepLevel?: string;
  personalizedAnswers?: Record<string, string>;
  studyRoutine?: any;
  targetExam?: string;
  // Settings
  readingDuration?: number;
  notificationsEnabled?: boolean;
  darkMode?: boolean;
}

// ---- Firestore: syllabus_trees Collection ----
export interface MicroConcept {
  id: string;
  name: string;
  content: string; // markdown content
  difficulty: DifficultyLevel;
}

export interface SubTopic {
  id: string;
  name: string;
  microConcepts: MicroConcept[];
}

export interface Topic {
  id: string;
  name: string;
  subTopics: SubTopic[];
}

export interface Subject {
  id?: string;
  name: string;
  subjectName?: string;
  description?: string;
  topics?: Topic[];
  weightage: number; // % of total marks
}

export interface SyllabusTree {
  userId: string;
  tree: Subject[];
  preparednessRating: Record<string, number>; // subjectId → 1-5
  createdAt: Date;
  updatedAt: Date;
}

// ---- Firestore: progress_nodes Collection ----
export interface ProgressNode {
  userId: string;
  conceptId: string;
  status: ConceptStatus;
  mistakeCount: number;
  feynmanClarityScore: number; // 0-100
  lastTested: Date;
  correctCount: number;
  totalAttempts: number;
  nextReviewAt?: Date;
  cachedContent?: string;
}

// ---- Firestore: ai_mentor_memory Collection ----
export interface MentorSessionLog {
  timestamp: Date;
  trigger: MentorTrigger;
  context: string;
  response: string;
  userEmotionalState?: string;
}

export interface MentorMemory {
  userId: string;
  sessionLogs: MentorSessionLog[];
  identifiedWeaknesses: string[];
  importantMemories?: string[];
  lastInteraction: Date;
}

// ---- Quiz / Active Recall ----
export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  conceptId: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  difficulty: DifficultyLevel;
}

// ---- Score Prediction ----
export interface ScorePrediction {
  totalScore: number;
  maxScore: number;
  topicScores: Record<
    string,
    {
      mastery: number;
      weightedScore: number;
      speed: number;
    }
  >;
  speedPenalty: number;
  consistencyMultiplier: number;
  weeklyDelta: number;
}

// ---- AI Context Payload ----
export interface AIContextPayload {
  currentState: string;
  currentTopic: string;
  timeSpent: string;
  recentErrors: number;
  streak: number;
  predictedScore: number;
  daysToExam: number;
  weaknesses: string[];
  // ---- The "Soul" properties ----
  joinDate: string;
  targetScore: number;
  prepLevel: string;
  favoriteSubject: string;
  importantMemories: string[];
}

// ---- Study Session ----
export interface StudySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  conceptsStudied: string[];
  questionsAttempted: number;
  correctAnswers: number;
  averageSpeed: number; // seconds per question
}
