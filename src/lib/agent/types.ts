// =============================================
// EXAMER Agent Architecture — Type Definitions
// =============================================

import type { DifficultyLevel } from "@/types";

// ---- Event System ----

export type AgentEventType =
  | "chat" // User sends a message
  | "tool_call" // Direct tool invocation from frontend
  | "session_start" // Begin a new study session
  | "session_end" // End current session (triggers memory commit)
  | "evaluate" // Evaluate a user's answer
  | "mentor_trigger" // System-triggered mentor intervention (idle, errors, etc.)
  | "feynman"; // Feynman technique evaluation

export interface AgentEvent {
  type: AgentEventType;
  sessionId: string;
  userId: string;
  payload: {
    message?: string;
    tool?: string;
    toolParams?: Record<string, unknown>;
    context?: AgentContext;
    trigger?: string;
    history?: ConversationMessage[];
  };
  timestamp: number;
}

export interface AgentContext {
  currentTopic: string;
  currentSubject: string;
  timeSpent: string;
  recentErrors: number;
  streak: number;
  predictedScore: number;
  targetScore: number;
  daysToExam: number;
  weaknesses: string[];
  prepLevel: string;
  favoriteSubject: string;
  importantMemories: string[];
}

// ---- Response System ----

export type AgentResponseType =
  | "text"
  | "stream"
  | "tool_result"
  | "error"
  | "session_created"
  | "session_ended";

export interface AgentResponse {
  type: AgentResponseType;
  sessionId: string;
  data: {
    text?: string;
    stream?: ReadableStream<Uint8Array>;
    toolCalls?: ToolCallResult[];
    error?: string;
    sessionSummary?: string;
    metadata?: Record<string, unknown>;
  };
  timestamp: number;
}

// ---- Tool System ----

export interface ToolParameterSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  enum?: string[];
  required?: boolean;
  items?: ToolParameterSchema;
  properties?: Record<string, ToolParameterSchema>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameterSchema>;
  requiredParams: string[];
  handler: (params: Record<string, unknown>) => Promise<ToolCallResult>;
}

export interface ToolCallResult {
  toolName: string;
  success: boolean;
  data: unknown;
  error?: string;
  executionTimeMs: number;
}

// Gemini-compatible function declaration format
export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required: string[];
  };
}

// ---- Memory System ----

export interface ConversationMessage {
  role: "user" | "model" | "system" | "tool";
  content: string;
  timestamp: number;
  metadata?: {
    toolName?: string;
    toolResult?: unknown;
    trigger?: string;
  };
}

export interface SessionMemory {
  sessionId: string;
  userId: string;
  messages: ConversationMessage[];
  summary: string; // Compressed summary of older messages
  startedAt: number;
  lastActivityAt: number;
  conceptsDiscussed: string[];
  toolsUsed: string[];
}

export interface LongTermProfile {
  userId: string;
  displayName: string;

  // Study profile
  studyGoals: string[];
  targetExam: string;
  targetScore: number;
  examDate: string;
  prepLevel: string;
  favoriteSubject: string;
  dailyStudyTime: string;
  personalizedAnswers?: Record<string, string>;

  // AI-tracked performance data
  weakTopics: WeakTopicEntry[];
  strongTopics: string[];
  performanceHistory: PerformanceSummary[];
  importantMemories: string[]; // AI-logged insights about the student
  personalityTraits: string[]; // Observed learning traits

  // Metadata
  totalSessions: number;
  totalStudyTimeMinutes: number;
  lastSessionAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeakTopicEntry {
  topic: string;
  subject: string;
  mistakeCount: number;
  lastTestedAt: string;
  improvementTrend: "improving" | "stagnant" | "declining";
}

export interface PerformanceSummary {
  date: string;
  sessionId: string;
  conceptsStudied: string[];
  questionsAttempted: number;
  correctAnswers: number;
  averageSpeed: number;
  predictedScoreAtTime: number;
  notes: string;
}

// ---- Agent Config ----

export interface AgentConfig {
  model: string;
  maxSessionMessages: number; // Sliding window limit
  summarizeAfter: number; // Trigger summarization after N messages
  temperature: number;
  maxOutputTokens: number;
  enableToolCalling: boolean;
  maxToolLoopIterations: number; // Prevent infinite tool loops
  memoryDir: string; // Local JSON storage path
  enableFirebaseSync: boolean;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: "", // Falls back to provider's defaultModel based on LLM_PROVIDER
  maxSessionMessages: 50,
  summarizeAfter: 40,
  temperature: 0.7,
  maxOutputTokens: 4096,
  enableToolCalling: true,
  maxToolLoopIterations: 5,
  memoryDir: ".examer/memory",
  enableFirebaseSync: true,
};

// ---- MCQ Types (for tool output) ----

export interface GeneratedMCQ {
  id: string;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: DifficultyLevel;
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  score: number; // 0-100
  feedback: string;
  conceptGaps: string[];
  suggestedReview: string[];
}

export interface SyllabusTopic {
  subject: string;
  topics: {
    name: string;
    subtopics: string[];
    weightage: number;
  }[];
}
