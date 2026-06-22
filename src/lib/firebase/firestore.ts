import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  serverTimestamp,
  where,
  arrayUnion,
  getCountFromServer,
  sum,
  getAggregateFromServer,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./config";
import type {
  SyllabusTree,
  ProgressNode,
  StudySession,
  MentorMemory,
  MentorSessionLog,
  ConceptStatus,
} from "@/types";

let firestorePermissionDenied = false;
let warnedServerFirestoreAuthMissing = false;

function isServerRuntimeWithoutClientAuth(): boolean {
  return typeof window === "undefined" && !auth.currentUser;
}

function shouldFallbackEarly(operation: string): boolean {
  if (firestorePermissionDenied) return true;

  if (isServerRuntimeWithoutClientAuth()) {
    if (!warnedServerFirestoreAuthMissing) {
      console.warn(
        `[Firebase] ${operation} skipped: Firestore client SDK is running on the server without Firebase user auth. Use Firebase Admin SDK for server-side Firestore access.`,
      );
      warnedServerFirestoreAuthMissing = true;
    }
    return true;
  }

  return false;
}

function isPermissionDenied(error: any): boolean {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return (
    code.includes("permission-denied") ||
    message.includes("permission_denied") ||
    message.includes("missing or insufficient permissions")
  );
}

function markFirestoreDenied(operation: string, error: any): void {
  if (!firestorePermissionDenied) {
    console.warn(
      `[Firebase] ${operation} denied by Firestore rules. Agent will use local fallback.`,
      error,
    );
  }
  firestorePermissionDenied = true;
}

// ============================================================
// USER PROFILE
// Path: users/{uid}
// Used by the Agent to hydrate LTM from onboarding data
// ============================================================

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  email: string;
  examDate: Date | null;
  targetScore: number;
  favoriteSubject: string;
  dailyStudyTime: string;
  prepLevel: string;
  onboardingComplete: boolean;
  predictedScore: number;
  streak: { current: number; longest: number; lastActive: Date | null };
  createdAt: Date;
}

export async function getUserProfile(
  uid: string,
): Promise<FirestoreUserProfile | null> {
  if (shouldFallbackEarly("getUserProfile")) return null;
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid,
      displayName: data.displayName || "Student",
      email: data.email || "",
      examDate: data.examDate?.toDate?.() || null,
      targetScore: data.targetScore || 200,
      favoriteSubject: data.favoriteSubject || "",
      dailyStudyTime: data.dailyStudyTime || "",
      prepLevel: data.prepLevel || "Unknown",
      onboardingComplete: !!data.onboardingComplete,
      predictedScore: data.predictedScore || 0,
      streak: {
        current: data.streak?.current || 0,
        longest: data.streak?.longest || 0,
        lastActive: data.streak?.lastActive?.toDate?.() || null,
      },
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      markFirestoreDenied("getUserProfile", error);
      return null;
    }
    throw error;
  }
}

// ============================================================
// SYLLABUS TREE
// Path: users/{uid}/syllabus_tree/current
// ============================================================

export async function saveSyllabusTree(
  uid: string,
  tree: SyllabusTree["tree"],
  preparednessRating: Record<string, number> = {},
): Promise<void> {
  const ref = doc(db, "users", uid, "syllabus_tree", "current");
  await setDoc(ref, {
    tree,
    preparednessRating,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getSyllabusTree(
  uid: string,
): Promise<SyllabusTree | null> {
  const ref = doc(db, "users", uid, "syllabus_tree", "current");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    userId: uid,
    tree: data.tree || [],
    preparednessRating: data.preparednessRating || {},
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  };
}

// ============================================================
// PROGRESS NODES
// Path: users/{uid}/progress_nodes/{conceptId}
// ============================================================

export async function saveProgressNode(
  uid: string,
  node: Omit<ProgressNode, "userId">,
): Promise<void> {
  const ref = doc(db, "users", uid, "progress_nodes", node.conceptId);
  await setDoc(
    ref,
    {
      ...node,
      lastTested: Timestamp.fromDate(
        node.lastTested instanceof Date ? node.lastTested : new Date(),
      ),
      nextReviewAt: node.nextReviewAt
        ? Timestamp.fromDate(
            node.nextReviewAt instanceof Date ? node.nextReviewAt : new Date(),
          )
        : null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getProgressNode(
  uid: string,
  conceptId: string,
): Promise<ProgressNode | null> {
  const ref = doc(db, "users", uid, "progress_nodes", conceptId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    userId: uid,
    conceptId: data.conceptId,
    status: data.status as ConceptStatus,
    mistakeCount: data.mistakeCount || 0,
    feynmanClarityScore: data.feynmanClarityScore || 0,
    lastTested: data.lastTested?.toDate?.() || new Date(),
    correctCount: data.correctCount || 0,
    totalAttempts: data.totalAttempts || 0,
    nextReviewAt: data.nextReviewAt?.toDate?.() || undefined,
    cachedContent: data.cachedContent,
  };
}

export async function getAllProgressNodes(
  uid: string,
): Promise<ProgressNode[]> {
  if (shouldFallbackEarly("getAllProgressNodes")) return [];
  try {
    const ref = collection(db, "users", uid, "progress_nodes");
    const snap = await getDocs(ref);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        userId: uid,
        conceptId: d.id,
        status: data.status as ConceptStatus,
        mistakeCount: data.mistakeCount || 0,
        feynmanClarityScore: data.feynmanClarityScore || 0,
        lastTested: data.lastTested?.toDate?.() || new Date(),
        correctCount: data.correctCount || 0,
        totalAttempts: data.totalAttempts || 0,
        nextReviewAt: data.nextReviewAt?.toDate?.() || undefined,
      };
    });
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      markFirestoreDenied("getAllProgressNodes", error);
      return [];
    }
    throw error;
  }
}

export async function getMasteredConceptsCount(uid: string): Promise<number> {
  if (shouldFallbackEarly("getMasteredConceptsCount")) return 0;
  try {
    const ref = collection(db, "users", uid, "progress_nodes");
    const q = query(ref, where("status", "==", "mastered"));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      markFirestoreDenied("getMasteredConceptsCount", error);
      return 0;
    }
    throw error;
  }
}

export async function getProgressStats(uid: string): Promise<{
  conceptsLearned: number;
  conceptsMastered: number;
  totalCorrect: number;
  totalAttempts: number;
}> {
  if (shouldFallbackEarly("getProgressStats")) {
    return {
      conceptsLearned: 0,
      conceptsMastered: 0,
      totalCorrect: 0,
      totalAttempts: 0,
    };
  }
  try {
    const ref = collection(db, "users", uid, "progress_nodes");

    const [learnedSnap, masteredSnap, aggSnap] = await Promise.all([
      getCountFromServer(query(ref, where("status", "!=", "new"))),
      getCountFromServer(query(ref, where("status", "==", "mastered"))),
      getAggregateFromServer(ref, {
        totalCorrect: sum("correctCount"),
        totalAttempts: sum("totalAttempts"),
      }),
    ]);

    return {
      conceptsLearned: learnedSnap.data().count,
      conceptsMastered: masteredSnap.data().count,
      totalCorrect: aggSnap.data().totalCorrect || 0,
      totalAttempts: aggSnap.data().totalAttempts || 0,
    };
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      markFirestoreDenied("getProgressStats", error);
    } else {
      console.warn("Error in getProgressStats:", error);
    }
    return {
      conceptsLearned: 0,
      conceptsMastered: 0,
      totalCorrect: 0,
      totalAttempts: 0,
    };
  }
}

export async function getProgressNodesBySubject(
  uid: string,
  subjectId: string,
): Promise<ProgressNode[]> {
  const ref = collection(db, "users", uid, "progress_nodes");
  const q = query(ref, where("subjectId", "==", subjectId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      userId: uid,
      conceptId: d.id,
      status: data.status as ConceptStatus,
      mistakeCount: data.mistakeCount || 0,
      feynmanClarityScore: data.feynmanClarityScore || 0,
      lastTested: data.lastTested?.toDate?.() || new Date(),
      correctCount: data.correctCount || 0,
      totalAttempts: data.totalAttempts || 0,
      nextReviewAt: data.nextReviewAt?.toDate?.() || undefined,
    };
  });
}

// ============================================================
// STUDY SESSIONS
// Path: users/{uid}/study_sessions/{sessionId}
// ============================================================

export async function createStudySession(
  uid: string,
  session: Omit<StudySession, "id" | "userId">,
): Promise<string> {
  const ref = collection(db, "users", uid, "study_sessions");
  const docRef = await addDoc(ref, {
    startTime: Timestamp.fromDate(
      session.startTime instanceof Date ? session.startTime : new Date(),
    ),
    endTime: null,
    conceptsStudied: session.conceptsStudied || [],
    questionsAttempted: session.questionsAttempted || 0,
    correctAnswers: session.correctAnswers || 0,
    averageSpeed: session.averageSpeed || 0,
  });
  return docRef.id;
}

export async function endStudySession(
  uid: string,
  sessionId: string,
  data: {
    endTime: Date;
    conceptsStudied: string[];
    questionsAttempted: number;
    correctAnswers: number;
    averageSpeed: number;
  },
): Promise<void> {
  const ref = doc(db, "users", uid, "study_sessions", sessionId);
  await updateDoc(ref, {
    endTime: Timestamp.fromDate(data.endTime),
    conceptsStudied: data.conceptsStudied,
    questionsAttempted: data.questionsAttempted,
    correctAnswers: data.correctAnswers,
    averageSpeed: data.averageSpeed,
  });
}

export async function getStudySessions(
  uid: string,
  limitCount: number = 20,
): Promise<StudySession[]> {
  if (shouldFallbackEarly("getStudySessions")) return [];
  try {
    const ref = collection(db, "users", uid, "study_sessions");
    const q = query(ref, orderBy("startTime", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: uid,
        startTime: data.startTime?.toDate?.() || new Date(),
        endTime: data.endTime?.toDate?.() || undefined,
        conceptsStudied: data.conceptsStudied || [],
        questionsAttempted: data.questionsAttempted || 0,
        correctAnswers: data.correctAnswers || 0,
        averageSpeed: data.averageSpeed || 0,
      };
    });
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      markFirestoreDenied("getStudySessions", error);
    } else {
      console.warn("Error in getStudySessions:", error);
    }
    return [];
  }
}

export async function getTodaysStudySessions(
  uid: string,
): Promise<StudySession[]> {
  if (shouldFallbackEarly("getTodaysStudySessions")) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  try {
    const ref = collection(db, "users", uid, "study_sessions");
    const q = query(
      ref,
      where("startTime", ">=", Timestamp.fromDate(today)),
      orderBy("startTime", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: uid,
        startTime: data.startTime?.toDate?.() || new Date(),
        endTime: data.endTime?.toDate?.() || undefined,
        conceptsStudied: data.conceptsStudied || [],
        questionsAttempted: data.questionsAttempted || 0,
        correctAnswers: data.correctAnswers || 0,
        averageSpeed: data.averageSpeed || 0,
      };
    });
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      markFirestoreDenied("getTodaysStudySessions", error);
    } else {
      console.warn("Error in getTodaysStudySessions:", error);
    }
    return [];
  }
}

// ============================================================
// AI MENTOR MEMORY
// Path: users/{uid}/mentor_memory/current
// ============================================================

const MAX_MENTOR_LOGS = 50;

export async function getMentorMemory(
  uid: string,
): Promise<MentorMemory | null> {
  if (shouldFallbackEarly("getMentorMemory")) return null;
  try {
    const snap = await getDoc(
      doc(db, "users", uid, "mentor_memory", "current"),
    );
    if (!snap.exists()) return null;

    // Convert Firestore doc to MentorMemory
    const data = snap.data();
    return {
      userId: uid,
      sessionLogs: (data.sessionLogs || []).map((log: any) => ({
        timestamp: log.timestamp?.toDate?.() || new Date(),
        trigger: log.trigger,
        context: log.context,
        response: log.response,
        userEmotionalState: log.userEmotionalState,
      })),
      identifiedWeaknesses: data.identifiedWeaknesses || [],
      importantMemories: data.importantMemories || [],
      lastInteraction: data.lastInteraction?.toDate?.() || new Date(),
    };
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      markFirestoreDenied("getMentorMemory", error);
      return null;
    }
    throw error;
  }
}

export async function addImportantMemory(uid: string, memory: string) {
  const ref = doc(db, "users", uid, "mentor_memory", "current");

  try {
    await updateDoc(ref, {
      importantMemories: arrayUnion(memory),
      lastInteraction: serverTimestamp(),
    });
  } catch (error: any) {
    if (error.code === "not-found") {
      await setDoc(ref, {
        userId: uid,
        sessionLogs: [],
        identifiedWeaknesses: [],
        importantMemories: [memory],
        lastInteraction: serverTimestamp(),
      });
    } else {
      throw error;
    }
  }
}

/**
 * Sync the local LongTermProfile to Firebase mentor_memory
 */
export async function syncLongTermProfile(
  uid: string,
  importantMemories: string[],
  weakTopics: string[],
): Promise<void> {
  if (shouldFallbackEarly("syncLongTermProfile")) return;
  const ref = doc(db, "users", uid, "mentor_memory", "current");
  try {
    await updateDoc(ref, {
      identifiedWeaknesses: weakTopics,
      importantMemories: importantMemories,
      lastInteraction: serverTimestamp(),
    });
  } catch (error: any) {
    if (
      error.code === "not-found" ||
      error.message?.includes("No document to update")
    ) {
      await setDoc(ref, {
        userId: uid,
        sessionLogs: [],
        identifiedWeaknesses: weakTopics,
        importantMemories: importantMemories,
        lastInteraction: serverTimestamp(),
      });
    } else if (isPermissionDenied(error)) {
      markFirestoreDenied("syncLongTermProfile", error);
    } else {
      console.error("[Firebase] syncLongTermProfile failed:", error);
    }
  }
}

export async function appendMentorLog(
  uid: string,
  log: MentorSessionLog,
  weaknesses?: string[],
): Promise<void> {
  const ref = doc(db, "users", uid, "mentor_memory", "current");
  const snap = await getDoc(ref);

  let sessionLogs: any[] = [];
  let identifiedWeaknesses: string[] = [];

  if (snap.exists()) {
    const data = snap.data();
    sessionLogs = data.sessionLogs || [];
    identifiedWeaknesses = data.identifiedWeaknesses || [];
  }

  // Add the new log
  sessionLogs.push({
    timestamp: Timestamp.fromDate(
      log.timestamp instanceof Date ? log.timestamp : new Date(),
    ),
    trigger: log.trigger,
    context: log.context,
    response: log.response,
    userEmotionalState: log.userEmotionalState || null,
  });

  // Cap at MAX_MENTOR_LOGS
  if (sessionLogs.length > MAX_MENTOR_LOGS) {
    sessionLogs = sessionLogs.slice(-MAX_MENTOR_LOGS);
  }

  // Merge weaknesses
  if (weaknesses) {
    const combined = new Set([...identifiedWeaknesses, ...weaknesses]);
    identifiedWeaknesses = Array.from(combined);
  }

  await setDoc(ref, {
    sessionLogs,
    identifiedWeaknesses,
    lastInteraction: serverTimestamp(),
  });
}

// ============================================================
// MOCK TESTS (Personalized for user)
// Path: users/{uid}/mock_tests/{testId}
// ============================================================

export interface MockTest {
  id: string;
  name: string;
  questions: number;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  subjects: string[];
  unlockCriteria: {
    minConceptsMastered: number;
  };
}

export async function getMockTests(userId: string): Promise<MockTest[]> {
  const ref = collection(db, "users", userId, "mock_tests");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as MockTest[];
}

export async function saveMockTests(userId: string, tests: MockTest[]): Promise<void> {
  const colRef = collection(db, "users", userId, "mock_tests");

  // Firestore writeBatch has a hard limit of 500 operations.
  const BATCH_LIMIT = 500;

  for (let i = 0; i < tests.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = tests.slice(i, i + BATCH_LIMIT);

    chunk.forEach((test) => {
      const docRef = doc(colRef, test.id);
      batch.set(docRef, test);
    });

    await batch.commit();
  }
}

// ============================================================
// MOCK RESULTS
// Path: users/{uid}/mock_results/{resultId}
// ============================================================

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

export async function saveMockResult(
  uid: string,
  result: MockResult,
): Promise<string> {
  const ref = collection(db, "users", uid, "mock_results");
  const docRef = await addDoc(ref, {
    ...result,
    completedAt: Timestamp.fromDate(
      result.completedAt instanceof Date ? result.completedAt : new Date(),
    ),
  });
  return docRef.id;
}

export async function getMockResults(
  uid: string,
  limitCount: number = 10,
): Promise<MockResult[]> {
  if (shouldFallbackEarly("getMockResults")) return [];
  try {
    const ref = collection(db, "users", uid, "mock_results");
    const q = query(ref, orderBy("completedAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        mockTestId: data.mockTestId,
        score: data.score,
        maxScore: data.maxScore,
        timeTaken: data.timeTaken,
        answers: data.answers || [],
        completedAt: data.completedAt?.toDate?.() || new Date(),
      };
    });
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      markFirestoreDenied("getMockResults", error);
      return [];
    }
    throw error;
  }
}

// ============================================================
// USER SETTINGS (extends users/{uid} doc)
// ============================================================

export async function updateUserSettings(
  uid: string,
  settings: {
    readingDuration?: number;
    notificationsEnabled?: boolean;
    darkMode?: boolean;
    whatsappOptIn?: boolean;
    whatsappNumber?: string;
    targetScore?: number;
    displayName?: string;
    examDate?: Date;
  },
): Promise<void> {
  const ref = doc(db, "users", uid);
  const updateData: Record<string, any> = {};

  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      if (key === "examDate" && value instanceof Date) {
        updateData[key] = Timestamp.fromDate(value);
      } else {
        updateData[key] = value;
      }
    }
  }

  if (Object.keys(updateData).length > 0) {
    await updateDoc(ref, updateData);
  }
}

// ============================================================
// STREAK MANAGEMENT
// ============================================================

export async function updateStreak(uid: string): Promise<{
  current: number;
  longest: number;
}> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { current: 0, longest: 0 };

  const data = snap.data();
  const streak = data.streak || { current: 0, longest: 0, lastActive: null };
  const lastActive = streak.lastActive?.toDate?.() || null;
  const now = new Date();

  let current = streak.current || 0;
  let longest = streak.longest || 0;

  if (lastActive) {
    // Compare calendar days, not raw milliseconds
    const lastDay = new Date(
      lastActive.getFullYear(),
      lastActive.getMonth(),
      lastActive.getDate(),
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round(
      (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      // Same calendar day, no change
    } else if (diffDays === 1) {
      // Consecutive calendar day
      current += 1;
      longest = Math.max(longest, current);
    } else {
      // Streak broken (missed a day or more)
      current = 1;
    }
  } else {
    current = 1;
  }

  const updatedStreak = {
    current,
    longest,
    lastActive: Timestamp.fromDate(now),
  };

  await updateDoc(ref, { streak: updatedStreak });
  return { current, longest };
}

// ============================================================
// ANALYTICS / DERIVED DATA HELPERS
// ============================================================

export async function getDashboardStats(uid: string): Promise<{
  conceptsLearned: number;
  conceptsMastered: number;
  todayStudyMinutes: number;
  totalStudyHours: number;
  overallAccuracy: number;
  averageSpeed: number;
  totalQuestionsAttempted: number;
}> {
  // Get aggregated progress stats
  const { conceptsLearned, conceptsMastered, totalCorrect, totalAttempts } =
    await getProgressStats(uid);

  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  // Get today's sessions
  const todaySessions = await getTodaysStudySessions(uid);
  let todayStudyMs = 0;
  for (const s of todaySessions) {
    if (s.endTime) {
      todayStudyMs += s.endTime.getTime() - s.startTime.getTime();
    } else {
      const elapsed = new Date().getTime() - s.startTime.getTime();
      todayStudyMs += Math.min(elapsed, 30 * 60 * 1000); // Cap unclosed sessions at 30 minutes
    }
  }
  const todayStudyMinutes = Math.round(todayStudyMs / (1000 * 60));

  // Get all sessions for total hours
  const allSessions = await getStudySessions(uid, 1000);
  let totalStudyMs = 0;
  for (const s of allSessions) {
    if (s.endTime) {
      totalStudyMs += s.endTime.getTime() - s.startTime.getTime();
    } else {
      const elapsed = new Date().getTime() - s.startTime.getTime();
      totalStudyMs += Math.min(elapsed, 30 * 60 * 1000); // Cap unclosed sessions at 30 minutes
    }
  }
  const totalStudyHours =
    Math.round((totalStudyMs / (1000 * 60 * 60)) * 10) / 10;

  // Average speed from sessions
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

/**
 * Get weekly speed & accuracy data from real study sessions (last 7 days).
 * Returns arrays grouped by day-of-week (Mon–Sun) for the SpeedCharts component.
 */
export async function getWeeklySpeedAccuracy(uid: string): Promise<{
  speedData: Array<{ label: string; value: number }>;
  accuracyData: Array<{ label: string; value: number }>;
}> {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Query sessions from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const ref = collection(db, "users", uid, "study_sessions");
  let snap = { docs: [] as any[] };
  try {
    const q = query(
      ref,
      where("startTime", ">=", Timestamp.fromDate(sevenDaysAgo)),
      orderBy("startTime", "asc")
    );
    snap = await getDocs(q);
  } catch (error: any) {
    if (isPermissionDenied(error)) markFirestoreDenied("getWeeklySpeedAccuracy", error);
    else console.warn("Error in getWeeklySpeedAccuracy:", error);
  }

  // Bucket sessions by day-of-week index (0=Sun ... 6=Sat)
  const buckets: Record<
    number,
    { totalQuestions: number; totalCorrect: number; speedValues: number[] }
  > = {};
  for (let i = 0; i < 7; i++) {
    buckets[i] = { totalQuestions: 0, totalCorrect: 0, speedValues: [] };
  }

  snap.docs.forEach((d) => {
    const data = d.data();
    const startTime: Date = data.startTime?.toDate?.() || new Date();
    const dayIndex = startTime.getDay(); // 0=Sun
    const questions = data.questionsAttempted || 0;
    const correct = data.correctAnswers || 0;
    const avgSpeed = data.averageSpeed || 0;

    buckets[dayIndex].totalQuestions += questions;
    buckets[dayIndex].totalCorrect += correct;
    if (avgSpeed > 0) {
      buckets[dayIndex].speedValues.push(avgSpeed);
    }
  });

  // Build ordered arrays for the last 7 days, ending today
  const orderedDays: number[] = [];
  const todayIndex = new Date().getDay();
  for (let i = 6; i >= 0; i--) {
    let d = todayIndex - i;
    if (d < 0) d += 7;
    orderedDays.push(d);
  }

  const speedData = orderedDays.map((dayIdx) => {
    const b = buckets[dayIdx];
    // Speed: average QPM across sessions that day
    let qpm = 0;
    if (b.speedValues.length > 0) {
      const avgSecsPerQ =
        b.speedValues.reduce((a, v) => a + v, 0) / b.speedValues.length;
      qpm = avgSecsPerQ > 0 ? Math.round((60 / avgSecsPerQ) * 10) / 10 : 0;
    }
    return { label: dayLabels[dayIdx], value: qpm };
  });

  const accuracyData = orderedDays.map((dayIdx) => {
    const b = buckets[dayIdx];
    const acc =
      b.totalQuestions > 0
        ? Math.round((b.totalCorrect / b.totalQuestions) * 100)
        : 0;
    return { label: dayLabels[dayIdx], value: acc };
  });

  return { speedData, accuracyData };
}

export async function getWeakTopics(
  uid: string,
  topLimit: number = 3,
): Promise<
  Array<{ name: string; mastery: number; attempts: number; conceptId: string }>
> {
  if (shouldFallbackEarly("getWeakTopics")) return [];
  try {
    const ref = collection(db, "users", uid, "progress_nodes");
    // We can't easily filter by (correctCount/totalAttempts) on server,
    // but we can at least filter by status !== mastered and totalAttempts > 0
    const q = query(
      ref,
      where("status", "in", ["new", "learning", "review_24h"])
    );
    const snap = await getDocs(q);

    const weak = snap.docs
      .filter((d) => d.data().totalAttempts > 0)
      .map((d) => {
        const n = d.data();
        return {
          name: d.id,
          conceptId: d.id,
          mastery:
            n.totalAttempts > 0
              ? Math.round((n.correctCount / n.totalAttempts) * 100)
              : 0,
          attempts: n.totalAttempts || 0,
        };
      })
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, topLimit);

    return weak;
  } catch (error: any) {
    if (isPermissionDenied(error)) {
      markFirestoreDenied("getWeakTopics", error);
    } else {
      console.warn("Error in getWeakTopics:", error);
    }
    return [];
  }
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
    const timeAgo = getTimeAgo(s.startTime);

    return {
      action:
        accuracy >= 0.8
          ? "Mastered Concept"
          : accuracy >= 0.5
            ? "Completed Session"
            : "Practice Session",
      topic: s.conceptsStudied[0] || "General Study",
      result: accuracy >= 0.5 ? ("correct" as const) : ("incorrect" as const),
      time: timeAgo,
    };
  });
}

// Helper: human-readable time ago
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
