import "server-only";

import {
  CollectionReference,
  FieldValue,
  Query,
  Timestamp,
} from "firebase-admin/firestore";
import { getAdminDb } from "./admin";
import type {
  ConceptStatus,
  MentorMemory,
  MentorSessionLog,
  ProgressNode,
  StudySession,
  SyllabusTree,
} from "@/types";

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  email: string;
  examDate: Date | null;
  targetExam?: string;
  targetScore: number;
  favoriteSubject: string;
  dailyStudyTime: string;
  prepLevel: string;
  personalizedAnswers?: Record<string, string>;
  onboardingComplete: boolean;
  predictedScore: number;
  streak: { current: number; longest: number; lastActive: Date | null };
  createdAt: Date;
}

export interface MockResult {
  id?: string;
  mockTestId: string;
  score: number;
  maxScore: number;
  timeTaken: number;
  answers: Array<{
    questionId: string;
    selectedOption: string;
    correct: boolean;
  }>;
  completedAt: Date;
}

function toDate(value: any, fallback = new Date()): Date {
  if (!value) return fallback;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function studySessionsCollection(uid: string): CollectionReference {
  return getAdminDb().collection("users").doc(uid).collection("study_sessions");
}

async function getTodaysStudySessions(uid: string): Promise<StudySession[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snap = await studySessionsCollection(uid)
    .where("startTime", ">=", Timestamp.fromDate(today))
    .orderBy("startTime", "desc")
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: uid,
      startTime: toDate(data.startTime),
      endTime: data.endTime ? toDate(data.endTime) : undefined,
      conceptsStudied: data.conceptsStudied || [],
      questionsAttempted: data.questionsAttempted || 0,
      correctAnswers: data.correctAnswers || 0,
      averageSpeed: data.averageSpeed || 0,
    };
  });
}

export async function getUserProfile(
  uid: string,
): Promise<FirestoreUserProfile | null> {
  const snap = await getAdminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  return {
    uid,
    displayName: data.displayName || "Student",
    email: data.email || "",
    examDate: data.examDate ? toDate(data.examDate) : null,
    targetScore: data.targetScore || 200,
    targetExam: data.targetExam || "Unknown",
    favoriteSubject: data.favoriteSubject || "",
    dailyStudyTime: data.dailyStudyTime || "",
    prepLevel: data.prepLevel || "Unknown",
    personalizedAnswers: data.personalizedAnswers || {},
    onboardingComplete: !!data.onboardingComplete,
    predictedScore: data.predictedScore || 0,
    streak: {
      current: data.streak?.current || 0,
      longest: data.streak?.longest || 0,
      lastActive: data.streak?.lastActive
        ? toDate(data.streak.lastActive)
        : null,
    },
    createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
  };
}

export async function getSyllabusTree(
  uid: string,
): Promise<SyllabusTree | null> {
  const snap = await getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("syllabus_tree")
    .doc("current")
    .get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  return {
    userId: uid,
    tree: data.tree || [],
    preparednessRating: data.preparednessRating || {},
    createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
  };
}

export async function getAllProgressNodes(
  uid: string,
): Promise<ProgressNode[]> {
  const snap = await getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("progress_nodes")
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      userId: uid,
      conceptId: d.id,
      status: data.status as ConceptStatus,
      mistakeCount: data.mistakeCount || 0,
      feynmanClarityScore: data.feynmanClarityScore || 0,
      lastTested: data.lastTested ? toDate(data.lastTested) : new Date(),
      correctCount: data.correctCount || 0,
      totalAttempts: data.totalAttempts || 0,
      nextReviewAt: data.nextReviewAt ? toDate(data.nextReviewAt) : undefined,
    };
  });
}

export async function getStudySessions(
  uid: string,
  limitCount: number = 20,
): Promise<StudySession[]> {
  const snap = await studySessionsCollection(uid)
    .orderBy("startTime", "desc")
    .limit(limitCount)
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: uid,
      startTime: toDate(data.startTime),
      endTime: data.endTime ? toDate(data.endTime) : undefined,
      conceptsStudied: data.conceptsStudied || [],
      questionsAttempted: data.questionsAttempted || 0,
      correctAnswers: data.correctAnswers || 0,
      averageSpeed: data.averageSpeed || 0,
    };
  });
}

export async function getMentorMemory(
  uid: string,
): Promise<MentorMemory | null> {
  const snap = await getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("mentor_memory")
    .doc("current")
    .get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  return {
    userId: uid,
    sessionLogs: (data.sessionLogs || []).map((log: any) => ({
      timestamp: log.timestamp ? toDate(log.timestamp) : new Date(),
      trigger: log.trigger,
      context: log.context,
      response: log.response,
      userEmotionalState: log.userEmotionalState,
    })),
    identifiedWeaknesses: data.identifiedWeaknesses || [],
    importantMemories: data.importantMemories || [],
    lastInteraction: data.lastInteraction
      ? toDate(data.lastInteraction)
      : new Date(),
  };
}

export async function addImportantMemory(
  uid: string,
  memory: string,
): Promise<void> {
  const ref = getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("mentor_memory")
    .doc("current");

  try {
    await ref.update({
      importantMemories: FieldValue.arrayUnion(memory),
      lastInteraction: FieldValue.serverTimestamp(),
    });
  } catch (error: any) {
    if (
      error.code === 5 ||
      String(error.message || "").includes("No document to update")
    ) {
      await ref.set({
        userId: uid,
        sessionLogs: [],
        identifiedWeaknesses: [],
        importantMemories: [memory],
        lastInteraction: FieldValue.serverTimestamp(),
      });
      return;
    }
    throw error;
  }
}

export async function syncLongTermProfile(
  uid: string,
  importantMemories: string[],
  weakTopics: string[],
): Promise<void> {
  const ref = getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("mentor_memory")
    .doc("current");
  await ref.set(
    {
      userId: uid,
      identifiedWeaknesses: weakTopics,
      importantMemories,
      lastInteraction: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function appendMentorLog(
  uid: string,
  log: MentorSessionLog,
  weaknesses?: string[],
): Promise<void> {
  const ref = getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("mentor_memory")
    .doc("current");
  const snap = await ref.get();

  let sessionLogs: any[] = [];
  let identifiedWeaknesses: string[] = [];

  if (snap.exists) {
    const data = snap.data()!;
    sessionLogs = data.sessionLogs || [];
    identifiedWeaknesses = data.identifiedWeaknesses || [];
  }

  sessionLogs.push({
    timestamp: Timestamp.fromDate(
      log.timestamp instanceof Date ? log.timestamp : new Date(),
    ),
    trigger: log.trigger,
    context: log.context,
    response: log.response,
    userEmotionalState: log.userEmotionalState || null,
  });

  if (sessionLogs.length > 50) {
    sessionLogs = sessionLogs.slice(-50);
  }

  if (weaknesses) {
    const combined = new Set([...identifiedWeaknesses, ...weaknesses]);
    identifiedWeaknesses = Array.from(combined);
  }

  await ref.set(
    {
      userId: uid,
      sessionLogs,
      identifiedWeaknesses,
      lastInteraction: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getMockResults(
  uid: string,
  limitCount: number = 10,
): Promise<MockResult[]> {
  const snap = await getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("mock_results")
    .orderBy("completedAt", "desc")
    .limit(limitCount)
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      mockTestId: data.mockTestId,
      score: data.score,
      maxScore: data.maxScore,
      timeTaken: data.timeTaken,
      answers: data.answers || [],
      completedAt: data.completedAt ? toDate(data.completedAt) : new Date(),
    };
  });
}

export async function getDashboardStats(uid: string): Promise<{
  conceptsLearned: number;
  conceptsMastered: number;
  todayStudyMinutes: number;
  totalStudyHours: number;
  overallAccuracy: number;
  averageSpeed: number;
  totalQuestionsAttempted: number;
}> {
  const progressNodes = await getAllProgressNodes(uid);

  const conceptsLearned = progressNodes.filter(
    (n) => n.status !== "new",
  ).length;
  const conceptsMastered = progressNodes.filter(
    (n) => n.status === "mastered",
  ).length;

  const totalCorrect = progressNodes.reduce((s, n) => s + n.correctCount, 0);
  const totalAttempts = progressNodes.reduce((s, n) => s + n.totalAttempts, 0);
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const todaySessions = await getTodaysStudySessions(uid);
  let todayStudyMs = 0;
  for (const s of todaySessions) {
    const end = s.endTime || new Date();
    todayStudyMs += end.getTime() - s.startTime.getTime();
  }
  const todayStudyMinutes = Math.round(todayStudyMs / (1000 * 60));

  const allSessions = await getStudySessions(uid, 1000);
  let totalStudyMs = 0;
  for (const s of allSessions) {
    const end = s.endTime || new Date();
    totalStudyMs += end.getTime() - s.startTime.getTime();
  }
  const totalStudyHours =
    Math.round((totalStudyMs / (1000 * 60 * 60)) * 10) / 10;

  const sessionsWithSpeed = allSessions.filter((s) => s.averageSpeed > 0);
  const averageSpeed =
    sessionsWithSpeed.length > 0
      ? Math.round(
          (sessionsWithSpeed.reduce((s, ss) => s + ss.averageSpeed, 0) /
            sessionsWithSpeed.length) *
            10,
        ) / 10
      : 0;

  return {
    conceptsLearned,
    conceptsMastered,
    todayStudyMinutes,
    totalStudyHours,
    overallAccuracy,
    averageSpeed,
    totalQuestionsAttempted: totalAttempts,
  };
}

export async function getWeakTopics(
  uid: string,
  topLimit: number = 3,
): Promise<
  Array<{ name: string; mastery: number; attempts: number; conceptId: string }>
> {
  const progressNodes = await getAllProgressNodes(uid);

  return progressNodes
    .filter((n) => n.totalAttempts > 0 && n.status !== "mastered")
    .map((n) => ({
      name: n.conceptId,
      conceptId: n.conceptId,
      mastery:
        n.totalAttempts > 0
          ? Math.round((n.correctCount / n.totalAttempts) * 100)
          : 0,
      attempts: n.totalAttempts,
    }))
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, topLimit);
}

export async function getRecentActivity(
  uid: string,
  limitCount: number = 5,
): Promise<
  Array<{
    action: string;
    topic: string;
    result: "correct" | "incorrect";
    time: string;
  }>
> {
  const sessions = await getStudySessions(uid, limitCount);

  return sessions.map((s) => {
    const accuracy =
      s.questionsAttempted > 0 ? s.correctAnswers / s.questionsAttempted : 0;

    return {
      action:
        accuracy >= 0.8
          ? "Mastered Concept"
          : accuracy >= 0.5
            ? "Completed Session"
            : "Practice Session",
      topic: s.conceptsStudied[0] || "General Study",
      result: accuracy >= 0.5 ? ("correct" as const) : ("incorrect" as const),
      time: getTimeAgo(s.startTime),
    };
  });
}
