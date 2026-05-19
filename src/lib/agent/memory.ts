// =============================================
// EXAMER Agent — Persistent Memory System
// =============================================
// Dual-memory architecture:
//   1. Short-Term: In-memory session message buffer with sliding window
//   2. Long-Term: Local JSON files (.examer/memory/) with optional Firebase sync
// =============================================

import fs from "fs/promises";
import path from "path";
import { ai } from "@/lib/gemini/client";
import {
  syncLongTermProfile,
  getUserProfile,
  getDashboardStats,
  getMentorMemory,
} from "@/lib/firebase/firestore-admin";
import type {
  SessionMemory,
  ConversationMessage,
  LongTermProfile,
  WeakTopicEntry,
  PerformanceSummary,
  AgentConfig,
} from "./types";

// =============================================
// 1. SHORT-TERM MEMORY (Session Context Window)
// =============================================

export class SessionMemoryManager {
  private sessions: Map<string, SessionMemory> = new Map();
  private config: AgentConfig;

  constructor(config?: Partial<AgentConfig>) {
    const { DEFAULT_AGENT_CONFIG: defaults } = require("./types");
    this.config = { ...defaults, ...config };
  }

  /**
   * Create a new session or retrieve an existing one
   */
  createSession(sessionId: string, userId: string): SessionMemory {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;

    const session: SessionMemory = {
      sessionId,
      userId,
      messages: [],
      summary: "",
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      conceptsDiscussed: [],
      toolsUsed: [],
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Add a message to the session history
   * Auto-triggers summarization if the window overflows
   */
  async addMessage(
    sessionId: string,
    message: ConversationMessage,
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(
        `Session ${sessionId} not found. Create a session first.`,
      );
    }

    session.messages.push(message);
    session.lastActivityAt = Date.now();

    // Track concepts and tools
    if (
      message.metadata?.toolName &&
      !session.toolsUsed.includes(message.metadata.toolName)
    ) {
      session.toolsUsed.push(message.metadata.toolName);
    }

    // Auto-summarize if window is getting too large
    if (session.messages.length > this.config.summarizeAfter) {
      await this.summarizeAndTruncate(sessionId);
    }
  }

  /**
   * Get the full conversation history for prompt assembly
   * Returns: [system summary of old messages] + [recent messages]
   */
  getHistory(sessionId: string): ConversationMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const history: ConversationMessage[] = [];

    // Prepend compressed summary of older conversations if exists
    if (session.summary) {
      history.push({
        role: "system",
        content: `[Previous conversation summary]: ${session.summary}`,
        timestamp: session.startedAt,
      });
    }

    // Add recent messages
    history.push(...session.messages);

    return history;
  }

  /**
   * Get full session metadata
   */
  getSession(sessionId: string): SessionMemory | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Compress older messages into a summary to free up context window
   */
  async summarizeAndTruncate(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.messages.length <= 10) return;

    // Take the oldest half of messages to summarize
    const cutoff = Math.floor(session.messages.length / 2);
    const toSummarize = session.messages.slice(0, cutoff);

    const conversationText = toSummarize
      .map((m) => `[${m.role}]: ${m.content}`)
      .join("\n");

    try {
      const result = await ai.models.generateContent({
        model: this.config.model,
        contents: `Summarize this study session conversation into 3-5 key bullet points. Focus on: topics discussed, student struggles, tools used, and any important insights. Be concise.\n\nConversation:\n${conversationText}`,
        config: {
          maxOutputTokens: 300,
          temperature: 0.3,
        },
      });

      const newSummary = result.text || "";

      // Merge with existing summary
      session.summary = session.summary
        ? `${session.summary}\n\n[Continued]:\n${newSummary}`
        : newSummary;

      // Keep only the recent messages
      session.messages = session.messages.slice(cutoff);

      console.log(
        `[Memory] Summarized ${cutoff} messages for session ${sessionId}`,
      );
    } catch (error) {
      console.error(
        "[Memory] Summarization failed, keeping full history:",
        error,
      );
      // Fallback: just trim oldest messages without AI summary
      session.messages = session.messages.slice(cutoff);
    }
  }

  /**
   * Generate a final session summary for long-term storage
   */
  async generateSessionSummary(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) return "No session data available.";

    const allContent = [
      session.summary ? `Earlier in session: ${session.summary}` : "",
      ...session.messages.map((m) => `[${m.role}]: ${m.content}`),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await ai.models.generateContent({
        model: this.config.model,
        contents: `Create a brief study session report (3-5 bullet points) capturing:
1. What topics were studied
2. Student's performance and struggles
3. Key takeaways and what to review next

Session data:\n${allContent}`,
        config: {
          maxOutputTokens: 400,
          temperature: 0.3,
        },
      });

      return result.text || "Session completed.";
    } catch {
      return `Session ${sessionId}: ${session.conceptsDiscussed.join(", ")} discussed. ${session.messages.length} messages exchanged.`;
    }
  }

  /**
   * Destroy a session and clean up memory
   */
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Track a concept discussed in the session
   */
  trackConcept(sessionId: string, concept: string): void {
    const session = this.sessions.get(sessionId);
    if (session && !session.conceptsDiscussed.includes(concept)) {
      session.conceptsDiscussed.push(concept);
    }
  }

  /**
   * Get all active session IDs for a user
   */
  getUserSessions(userId: string): string[] {
    const sessions: string[] = [];
    Array.from(this.sessions.entries()).forEach(([id, session]) => {
      if (session.userId === userId) {
        sessions.push(id);
      }
    });
    return sessions;
  }
}

// =============================================
// 2. LONG-TERM MEMORY (Persistent Student Profile)
// =============================================

export class LongTermMemoryManager {
  private memoryDir: string;
  private profileCache: Map<string, LongTermProfile> = new Map();

  constructor(memoryDir?: string) {
    this.memoryDir = memoryDir || path.join(process.cwd(), ".examer", "memory");
  }

  /**
   * Ensure the memory directory exists
   */
  private async ensureDir(): Promise<void> {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") throw error;
    }
  }

  /**
   * Get the file path for a user's profile
   */
  private profilePath(userId: string): string {
    // Sanitize userId to prevent path traversal
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(this.memoryDir, `${safeId}.json`);
  }

  /**
   * Load a student's long-term profile
   * Creates a default profile if none exists
   */
  async loadProfile(userId: string): Promise<LongTermProfile> {
    // Check cache first
    const cached = this.profileCache.get(userId);
    if (cached) return cached;

    await this.ensureDir();
    const filePath = this.profilePath(userId);

    try {
      const data = await fs.readFile(filePath, "utf-8");
      const profile: LongTermProfile = JSON.parse(data);

      // If profile looks like defaults (displayName is still "Student"), try hydrating from Firebase
      if (profile.displayName === "Student" || !profile.displayName) {
        console.log(
          `[LTM] Profile for ${userId} has default name — hydrating from Firestore...`,
        );
        const hydrated = await this.hydrateFromFirestore(userId, profile);
        this.profileCache.set(userId, hydrated);
        return hydrated;
      }

      this.profileCache.set(userId, profile);
      return profile;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // Create default profile then hydrate from Firestore
        console.log(
          `[LTM] No local profile for ${userId} — creating from Firestore...`,
        );
        const defaultProfile = this.createDefaultProfile(userId);
        const hydrated = await this.hydrateFromFirestore(
          userId,
          defaultProfile,
        );
        await this.saveProfile(userId, hydrated);
        return hydrated;
      }
      throw new Error(`Failed to load profile for ${userId}: ${error.message}`);
    }
  }

  /**
   * Hydrate a LTM profile from Firestore user document + stats.
   * Pulls real onboarding data (name, exam date, subjects, etc.)
   * and merges it into the local profile WITHOUT overwriting AI-tracked data.
   */
  async hydrateFromFirestore(
    userId: string,
    profile: LongTermProfile,
  ): Promise<LongTermProfile> {
    try {
      // 1. Pull user profile from Firestore (onboarding data)
      const firestoreUser = await getUserProfile(userId);
      if (firestoreUser && firestoreUser.onboardingComplete) {
        console.log(
          `[LTM] Hydrating from Firestore: ${firestoreUser.displayName}`,
        );

        // Merge onboarding data into LTM profile
        profile.displayName = firestoreUser.displayName || profile.displayName;
        profile.targetExam = firestoreUser.targetExam || profile.targetExam;
        profile.targetScore = firestoreUser.targetScore || profile.targetScore;
        profile.examDate = firestoreUser.examDate
          ? firestoreUser.examDate.toISOString().split("T")[0]
          : profile.examDate;
        profile.prepLevel = firestoreUser.prepLevel || profile.prepLevel;
        profile.favoriteSubject =
          firestoreUser.favoriteSubject || profile.favoriteSubject;
        profile.dailyStudyTime =
          firestoreUser.dailyStudyTime || profile.dailyStudyTime;
        profile.personalizedAnswers =
          firestoreUser.personalizedAnswers || profile.personalizedAnswers;
      } else if (firestoreUser) {
        // User exists but hasn't completed onboarding — still grab what we can
        profile.displayName = firestoreUser.displayName || profile.displayName;
      }

      // 2. Pull study stats from Firebase (progress data)
      try {
        const stats = await getDashboardStats(userId);
        if (stats.totalQuestionsAttempted > 0) {
          profile.totalStudyTimeMinutes = Math.round(
            stats.totalStudyHours * 60,
          );
        }
      } catch (statsErr) {
        console.warn("[LTM] Stats hydration failed (non-critical):", statsErr);
      }

      // 3. Pull mentor memories from Firebase
      try {
        const mentorMemory = await getMentorMemory(userId);
        if (mentorMemory) {
          // Merge memories (don't duplicate)
          const existingSet = new Set(profile.importantMemories);
          for (const mem of mentorMemory.importantMemories || []) {
            if (!existingSet.has(mem)) {
              profile.importantMemories.push(mem);
            }
          }
        }
      } catch (memErr) {
        console.warn(
          "[LTM] Mentor memory hydration failed (non-critical):",
          memErr,
        );
      }

      profile.updatedAt = new Date().toISOString();

      // Save the hydrated profile to disk
      await this.ensureDir();
      const filePath = this.profilePath(userId);
      await fs.writeFile(filePath, JSON.stringify(profile, null, 2), "utf-8");
      this.profileCache.set(userId, profile);

      console.log(
        `[LTM] Hydration complete for ${profile.displayName} (${userId})`,
      );
    } catch (error) {
      console.warn(
        "[LTM] Firestore hydration failed, using local defaults:",
        error,
      );
    }

    return profile;
  }

  /**
   * Save a student's profile to disk
   */
  async saveProfile(userId: string, profile: LongTermProfile): Promise<void> {
    await this.ensureDir();
    const filePath = this.profilePath(userId);

    profile.updatedAt = new Date().toISOString();

    try {
      await fs.writeFile(filePath, JSON.stringify(profile, null, 2), "utf-8");
      this.profileCache.set(userId, profile);

      // Sync to Firebase in the background (fire-and-forget to avoid blocking)
      const weakTopics = profile.weakTopics.map((wt) => wt.topic);
      syncLongTermProfile(userId, profile.importantMemories, weakTopics).catch(
        (err) =>
          console.warn(
            `[Memory] Background Firebase sync failed for ${userId}:`,
            err,
          ),
      );
    } catch (error: any) {
      throw new Error(`Failed to save profile for ${userId}: ${error.message}`);
    }
  }

  /**
   * Add or update a weak topic entry
   */
  async addWeakTopic(
    userId: string,
    entry: Omit<WeakTopicEntry, "lastTestedAt" | "improvementTrend">,
  ): Promise<void> {
    const profile = await this.loadProfile(userId);

    const existing = profile.weakTopics.find(
      (t) => t.topic === entry.topic && t.subject === entry.subject,
    );

    if (existing) {
      const previousMistakes = existing.mistakeCount;
      existing.mistakeCount += entry.mistakeCount;
      existing.lastTestedAt = new Date().toISOString();
      existing.improvementTrend =
        entry.mistakeCount < previousMistakes
          ? "improving"
          : entry.mistakeCount === previousMistakes
            ? "stagnant"
            : "declining";
    } else {
      profile.weakTopics.push({
        ...entry,
        lastTestedAt: new Date().toISOString(),
        improvementTrend: "stagnant",
      });
    }

    await this.saveProfile(userId, profile);
  }

  /**
   * Log a performance summary after a session
   */
  async logPerformance(
    userId: string,
    summary: PerformanceSummary,
  ): Promise<void> {
    const profile = await this.loadProfile(userId);

    profile.performanceHistory.push(summary);
    profile.totalSessions += 1;
    profile.lastSessionAt = new Date().toISOString();

    // Keep only last 100 performance entries to prevent unbounded growth
    if (profile.performanceHistory.length > 100) {
      profile.performanceHistory = profile.performanceHistory.slice(-100);
    }

    await this.saveProfile(userId, profile);
  }

  /**
   * Add an important memory the AI noticed about the student
   */
  async logImportantMemory(userId: string, memory: string): Promise<void> {
    const profile = await this.loadProfile(userId);

    // Deduplicate similar memories
    if (!profile.importantMemories.includes(memory)) {
      profile.importantMemories.push(memory);

      // Cap at 50 memories
      if (profile.importantMemories.length > 50) {
        profile.importantMemories = profile.importantMemories.slice(-50);
      }
    }

    await this.saveProfile(userId, profile);
  }

  /**
   * Get a concise snapshot for prompt injection
   * This is what gets injected into the LLM system prompt
   */
  async getStudentSnapshot(userId: string): Promise<string> {
    const profile = await this.loadProfile(userId);
    const isPlaceholderProfile =
      profile.displayName === "Student" &&
      profile.totalSessions === 0 &&
      profile.weakTopics.length === 0 &&
      profile.importantMemories.length === 0 &&
      !profile.favoriteSubject &&
      !profile.examDate;

    const weakTopicsList = profile.weakTopics
      .sort((a, b) => b.mistakeCount - a.mistakeCount)
      .slice(0, 5)
      .map(
        (t) =>
          `${t.topic} (${t.subject}) — ${t.mistakeCount} mistakes, ${t.improvementTrend}`,
      )
      .join("\n  - ");

    const recentPerformance = profile.performanceHistory
      .slice(-3)
      .map(
        (p) =>
          `${p.date}: ${p.correctAnswers}/${p.questionsAttempted} correct, score ${p.predictedScoreAtTime}`,
      )
      .join("\n  - ");

    const memories = profile.importantMemories.slice(-5).join(". ");

    const personalizedStr = profile.personalizedAnswers
      ? Object.entries(profile.personalizedAnswers)
          .map(([k, v]) => `  - ${k}: ${v}`)
          .join("\n")
      : "None";

    return `--- Student Profile (Long-Term Memory) ---
      Profile Status: ${isPlaceholderProfile ? "Placeholder/default only. Use data tools before making personalized claims." : "Loaded from persisted memory."}
  Name: ${profile.displayName}
  Target Exam: ${profile.targetExam}
  Target Score: ${profile.targetScore}
  Exam Date: ${profile.examDate}
  Prep Level: ${profile.prepLevel}
  Favorite Subject: ${profile.favoriteSubject}
  Daily Study Time: ${profile.dailyStudyTime}
  
  Personalized Questionnaire Answers:
${personalizedStr}

Total Sessions: ${profile.totalSessions}
Study Goals: ${profile.studyGoals.join(", ") || "Not set"}
Strong Topics: ${profile.strongTopics.join(", ") || "None identified yet"}

Top Weak Areas:
  - ${weakTopicsList || "None identified yet"}

Recent Performance:
  - ${recentPerformance || "No data yet"}

Important Memories: ${memories || "None recorded yet"}
Personality Traits: ${profile.personalityTraits.join(", ") || "Still learning about student"}
---------------------------------------------`;
  }

  /**
   * Get weak topics list (for tool access)
   */
  async getWeakTopics(userId: string): Promise<WeakTopicEntry[]> {
    const profile = await this.loadProfile(userId);
    return profile.weakTopics.sort((a, b) => b.mistakeCount - a.mistakeCount);
  }

  /**
   * Update study goals
   */
  async updateStudyGoals(userId: string, goals: string[]): Promise<void> {
    const profile = await this.loadProfile(userId);
    profile.studyGoals = goals;
    await this.saveProfile(userId, profile);
  }

  /**
   * Clear the in-memory cache (useful for testing)
   */
  clearCache(): void {
    this.profileCache.clear();
  }

  /**
   * Create a default empty profile
   */
  private createDefaultProfile(userId: string): LongTermProfile {
    return {
      userId,
      displayName: "Student",
      studyGoals: [],
      targetExam: "Unknown",
      targetScore: 200,
      examDate: "",
      prepLevel: "Unknown",
      favoriteSubject: "",
      dailyStudyTime: "",
      personalizedAnswers: {},
      weakTopics: [],
      strongTopics: [],
      performanceHistory: [],
      importantMemories: [],
      personalityTraits: [],
      totalSessions: 0,
      totalStudyTimeMinutes: 0,
      lastSessionAt: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

// =============================================
// 3. SINGLETON INSTANCES (Module-level exports)
// =============================================

// Lazy-initialized singletons to avoid startup overhead
let _sessionMemory: SessionMemoryManager | null = null;
let _longTermMemory: LongTermMemoryManager | null = null;

export function getSessionMemory(
  config?: Partial<AgentConfig>,
): SessionMemoryManager {
  if (!_sessionMemory) {
    _sessionMemory = new SessionMemoryManager(config);
  }
  return _sessionMemory;
}

export function getLongTermMemory(memoryDir?: string): LongTermMemoryManager {
  if (!_longTermMemory) {
    _longTermMemory = new LongTermMemoryManager(memoryDir);
  }
  return _longTermMemory;
}
