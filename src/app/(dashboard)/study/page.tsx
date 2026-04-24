/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReadingPane from "@/components/study-engine/ReadingPane";
import ActiveRecallBox from "@/components/study-engine/ActiveRecallBox";
import FeynmanInput from "@/components/study-engine/FeynmanInput";
import ConceptCard from "@/components/study-engine/ConceptCard";
import LessonSkeleton from "@/components/study-engine/LessonSkeleton";
import StudyMentorPanel from "@/components/study-engine/StudyMentorPanel";
import CircularAccuracy from "@/components/analytics/CircularAccuracy";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useStudyStore } from "@/store/useStudyStore";
import { useMetricsStore } from "@/store/useMetricsStore";
import { useMentorStore } from "@/store/useMentorStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  saveProgressNode,
  getProgressNode,
  getAllProgressNodes,
  createStudySession,
  endStudySession,
} from "@/lib/firebase/firestore";
import {
  BookOpen,
  ArrowRight,
  Trophy,
  Loader2,
} from "lucide-react";
import type {
  QuizQuestion,
  MicroConcept,
  ConceptStatus,
  ProgressNode,
} from "@/types";

// ---- Fallback Mock Data (used when no syllabus tree exists) ----
const fallbackConcepts: Array<{
  concept: MicroConcept;
  subject: string;
  subjectId: string;
  topicId: string;
  status: ConceptStatus;
  mastery: number;
  mistakes: number;
}> = [
  {
    concept: {
      id: "math-deriv-chain",
      name: "Chain Rule of Derivatives",
      content: `The Chain Rule is one of the most important rules in calculus for finding derivatives of composite functions.\n\nIf you have a function y = f(g(x)), where one function is "inside" another, the chain rule tells you how to differentiate it.\n\nThe Rule: dy/dx = f'(g(x)) · g'(x)\n\nIn other words: "Derivative of the outer function (evaluated at the inner function) TIMES the derivative of the inner function."\n\nExample: Find d/dx [sin(x²)]\n- Outer function: sin(u), derivative = cos(u)\n- Inner function: u = x², derivative = 2x\n- Chain Rule: cos(x²) · 2x = 2x·cos(x²)\n\nThink of it like peeling an onion — you differentiate layer by layer, from outside to inside, and multiply all the layers together.\n\nCommon Mistake: Students often forget to multiply by the derivative of the inner function. If you just write cos(x²) without the 2x, you've lost marks.`,
      difficulty: 2,
    },
    subject: "Mathematics",
    subjectId: "math",
    topicId: "math-calc",
    status: "learning",
    mastery: 45,
    mistakes: 3,
  },
  {
    concept: {
      id: "phys-newton3",
      name: "Newton's Third Law",
      content: `Newton's Third Law of Motion states: "For every action, there is an equal and opposite reaction."\n\nThis means when object A exerts a force on object B, object B simultaneously exerts a force equal in magnitude but opposite in direction on object A.\n\nKey Points:\n- Forces always come in pairs (action-reaction pairs)\n- These paired forces act on DIFFERENT objects\n- They are equal in magnitude, opposite in direction\n- They occur simultaneously\n\nExample: When you push a wall, the wall pushes back on your hand with equal force. You don't go through the wall because of this reaction force.\n\nCommon Misconception: Students think that because forces are "equal and opposite," objects shouldn't move. But remember — the forces act on DIFFERENT objects! A horse pulls a cart forward; the cart pulls the horse backward. But the horse accelerates because the ground pushes the horse forward (friction) more than the cart pulls it back.\n\n**(This is reading directly from the Cache!)**`,
      difficulty: 1,
    },
    subject: "Physics",
    subjectId: "phys",
    topicId: "phys-mech",
    status: "new",
    mastery: 0,
    mistakes: 0,
  },
  {
    concept: {
      id: "econ-supply-demand",
      name: "Supply and Demand Curves",
      content: `Supply and Demand: The fundamental model of how prices are determined in a market economy.\n\nDemand Curve: Shows the relationship between price and quantity demanded. It slopes DOWNWARD (as price increases, quantity demanded decreases).\n\nSupply Curve: Shows the relationship between price and quantity supplied. It slopes UPWARD (as price increases, quantity supplied increases).\n\nEquilibrium: Where supply meets demand. At this point, the quantity demanded equals the quantity supplied. The price at this point is the "market price."\n\nShifts vs. Movements:\n- Movement ALONG the curve: caused by a change in the good's own price\n- Shift OF the curve: caused by factors other than price (income, preferences, technology)\n\nKey: Don't confuse "change in demand" (shift) with "change in quantity demanded" (movement along).`,
      difficulty: 2,
    },
    subject: "Economics",
    subjectId: "econ",
    topicId: "econ-micro",
    status: "review_24h",
    mastery: 62,
    mistakes: 1,
  },
];

const mockQuestion: QuizQuestion = {
  id: "q1",
  conceptId: "math-deriv-chain",
  question: "What is the derivative of sin(3x² + 1)?",
  options: [
    { id: "a", text: "cos(3x² + 1)", isCorrect: false },
    { id: "b", text: "6x · cos(3x² + 1)", isCorrect: true },
    { id: "c", text: "3x² · cos(3x² + 1)", isCorrect: false },
    { id: "d", text: "-cos(3x² + 1) · 6x", isCorrect: false },
  ],
  explanation:
    "Using the Chain Rule: d/dx[sin(u)] = cos(u) · du/dx. Here u = 3x² + 1, so du/dx = 6x. Answer: 6x · cos(3x² + 1).",
  difficulty: 2,
};

type FeynmanEvaluation = {
  clarityScore: number;
  misunderstandings: string[];
  strengths: string[];
  feedback: string;
};

type ConceptItem = {
  concept: MicroConcept;
  subject: string;
  subjectId: string;
  topicId: string;
  status: ConceptStatus;
  mastery: number;
  mistakes: number;
};

type StudyPhase = "select" | "reading" | "recall" | "feynman" | "complete";

export default function StudyPage() {
  const [phase, setPhase] = useState<StudyPhase>("select");
  const [selectedConcept, setSelectedConcept] = useState<ConceptItem | null>(
    null,
  );
  const [timer, setTimer] = useState(0);
  const [isBlurring, setIsBlurring] = useState(false);
  const [feynmanEval, setFeynmanEval] = useState<FeynmanEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0, total: 0 });
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  const user = useAuthStore((s) => s.user);
  const syllabusTree = useAuthStore((s) => s.syllabusTree);
  const triggerMentor = useMentorStore((s) => s.triggerMentor);
  const startQuestion = useMetricsStore((s) => s.startQuestion);
  const recordAnswer = useMetricsStore((s) => s.recordAnswer);
  const startStudySession = useStudyStore((s) => s.startStudySession); // Get the study store instance

  // Tracking refs for cleanup
  const activeSessionRef = React.useRef<{
    id: string | null;
    uid: string | null;
    conceptId: string | null;
  }>({ id: null, uid: null, conceptId: null });

  // Sync refs when they change
  useEffect(() => {
    activeSessionRef.current = {
      id: currentSessionId,
      uid: user?.uid || null,
      conceptId: selectedConcept?.concept.id || null,
    };
  }, [currentSessionId, user, selectedConcept]);

  // Cleanup on unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      const active = activeSessionRef.current;
      if (active.id && active.uid) {
        // We use a beacon or direct firestore fetch if possible. 
        // In client-side firebase, just calling the update is usually enough for SPA changes
        // but for tab closes, it's best-effort.
        const metrics = useMetricsStore.getState();
        endStudySession(active.uid, active.id, {
          endTime: new Date(),
          conceptsStudied: active.conceptId ? [active.conceptId] : [],
          questionsAttempted: metrics.questionsAttempted,
          correctAnswers: metrics.correctCount,
          averageSpeed: metrics.avgSecondsPerQuestion,
        }).catch(console.error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload(); // Call on unmount
    };
  }, []);

  // Build concepts from syllabus tree + progress nodes
  useEffect(() => {
    async function loadConcepts() {
      setLoading(true);

      if (!user) {
        setConcepts(fallbackConcepts);
        setLoading(false);
        return;
      }

      // Get all progress nodes for the user
      let progressMap: Record<string, ProgressNode> = {};
      try {
        const nodes = await getAllProgressNodes(user.uid);
        progressMap = Object.fromEntries(nodes.map((n) => [n.conceptId, n]));
      } catch (err) {
        console.error("Error loading progress nodes:", err);
      }

      // If syllabus tree exists, build concept list from it
      if (syllabusTree && syllabusTree.tree && syllabusTree.tree.length > 0) {
        const items: ConceptItem[] = [];

        for (const subject of syllabusTree.tree) {
          const subjName =
            subject.subjectName || subject.name || "Unknown Subject";
          const subjectId =
            subject.id ||
            subjName.toLowerCase().replace(/\s+/g, "-") ||
            "unknown";
          for (const topic of subject.topics || []) {
            const topicId =
              topic.id ||
              topic.name?.toLowerCase().replace(/\s+/g, "-") ||
              "unknown";
            for (const subTopic of topic.subTopics || []) {
              for (const mc of subTopic.microConcepts || []) {
                const conceptId =
                  mc.id ||
                  mc.name?.toLowerCase().replace(/\s+/g, "-") ||
                  "unknown";
                const progress = progressMap[conceptId];

                items.push({
                  concept: {
                    id: conceptId,
                    name: mc.name,
                    content:
                      progress?.cachedContent ||
                      mc.content ||
                      `Study material for: ${mc.name}\n\nThis concept is part of ${subTopic.name} under ${topic.name} in ${subject.name}.`,
                    difficulty: mc.difficulty || 2,
                  },
                  subject: subjName,
                  subjectId,
                  topicId,
                  status: progress?.status || "new",
                  mastery: progress
                    ? progress.totalAttempts > 0
                      ? Math.round(
                          (progress.correctCount / progress.totalAttempts) *
                            100,
                        )
                      : 0
                    : 0,
                  mistakes: progress?.mistakeCount || 0,
                });
              }
            }
          }
        }

        if (items.length > 0) {
          // Sort: new → learning → review → mastered
          const statusOrder: Record<string, number> = {
            new: 0,
            learning: 1,
            review_24h: 2,
            mastered: 3,
          };
          items.sort(
            (a, b) =>
              (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0),
          );
          setConcepts(items);
        } else {
          setConcepts(fallbackConcepts);
        }
      } else {
        // Enrich fallback concepts with any existing progress
        const enriched = fallbackConcepts.map((item) => {
          const progress = progressMap[item.concept.id];
          if (progress) {
            return {
              ...item,
              status: progress.status,
              mastery:
                progress.totalAttempts > 0
                  ? Math.round(
                      (progress.correctCount / progress.totalAttempts) * 100,
                    )
                  : 0,
              mistakes: progress.mistakeCount,
            };
          }
          return item;
        });
        setConcepts(enriched);
      }

      setLoading(false);
    }

    loadConcepts();
  }, [user, syllabusTree]);

  // Add this right before your timer useEffects
  const dynamicReadingTime = useMemo(() => {
    if (!selectedConcept?.concept.content) return 150; // Fallback
    const wordCount = selectedConcept.concept.content.split(/\s+/).length;
    // Calculate seconds: (words / 200 wpm) * 60, minimum 45 seconds
    return Math.max(45, Math.ceil((wordCount / 200) * 60)); 
  }, [selectedConcept?.concept.content]);

  // Timer effect
  useEffect(() => {
    if (phase !== "reading") return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-transition from reading to recall (Dynamic Version)
  useEffect(() => {
    if (phase === "reading" && timer >= dynamicReadingTime) {
      setIsBlurring(true);
      setTimeout(() => {
        setPhase("recall");
        setIsBlurring(false);
        setTimer(0);
        startQuestion();
      }, 800);
    }
  }, [timer, phase, dynamicReadingTime]);

  const handleSelectConcept = async (item: ConceptItem) => {
    // Stop any ongoing mentor stream
    useMentorStore.getState().finishStreaming(); // Access mentorStore directly from state

    // If content is already cached (meaning it's not the default fallback block string and not empty),
    // we can bypass the AI generation completely!
    const isDefaultContent =
      item.concept.content.startsWith("Study material for:") ||
      item.concept.content === "";
    if (!isDefaultContent && item.concept.content.length > 50) {
      setSelectedConcept(item);
      
      // Still need to generate the question
      setIsGeneratingQuestion(true);
      setCurrentQuestion(null);
      fetch("/api/study/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: item.concept.name,
          subject: item.subject,
          conceptId: item.concept.id
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.question) setCurrentQuestion(data.question);
        })
        .catch((err) => console.error("Error generating question", err))
        .finally(() => setIsGeneratingQuestion(false));

      startStudySession(
        item.concept as MicroConcept,
        item.subject,
        "unknown",
      );

      if (user) {
        try {
          const sessionId = await createStudySession(user.uid, {
            conceptsStudied: [item.concept.id],
            startTime: new Date(),
            endTime: new Date(),
            questionsAttempted: 0,
            correctAnswers: 0,
            averageSpeed: 0,
          });
          setCurrentSessionId(sessionId);
        } catch (e) {
          console.error("Failed to create session:", e);
        }
      }

      setPhase("reading");
      setTimer(0);
      setTimeout(() => {
        triggerMentor(
          "idle",
          `Jumping back into ${item.concept.name}! Let me know if you need help remembering anything.`,
        );
      }, 1000);
      return;
    }

    setIsGeneratingContent(true);
    setIsGeneratingQuestion(true);
    setCurrentQuestion(null);

    try {
      // Generate content and question concurrently
      const [response, questionResponse] = await Promise.all([
        fetch("/api/study/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            concept: item.concept.name,
            subject: item.subject,
          }),
        }),
        fetch("/api/study/question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            concept: item.concept.name,
            subject: item.subject,
            conceptId: item.concept.id
          }),
        }).catch(() => null)
      ]);

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      
      if (questionResponse?.ok) {
        const questionData = await questionResponse.json();
        if (questionData.question) setCurrentQuestion(questionData.question);
      }
      setIsGeneratingQuestion(false);

      // Create a new concept object with the generated content
      const enrichedItem = {
        ...item,
        concept: {
          ...item.concept,
          content:
            data.content || "Content generation failed. Please try again.",
        },
      };

      setSelectedConcept(enrichedItem);
      startStudySession(
        enrichedItem.concept as MicroConcept,
        enrichedItem.subject,
        "unknown",
      );

      // Create a new study session in Firestore
      if (user) {
        try {
          // Save the specifically generated content to the cache
          await saveProgressNode(user.uid, {
            conceptId: enrichedItem.concept.id,
            status: enrichedItem.status,
            mistakeCount: enrichedItem.mistakes,
            feynmanClarityScore: 0,
            lastTested: new Date(),
            correctCount: 0,
            totalAttempts: 0,
            cachedContent: data.content,
          });

          const sessionId = await createStudySession(user.uid, {
            conceptsStudied: [enrichedItem.concept.id],
            startTime: new Date(),
            endTime: new Date(),
            questionsAttempted: 0,
            correctAnswers: 0,
            averageSpeed: 0,
          });
          setCurrentSessionId(sessionId);
        } catch (e) {
          console.error("Failed to save cache or create session:", e);
        }
      }

      setPhase("reading");
      setTimer(0);

      // Welcome the user with the mentor implicitly
      setTimeout(() => {
        triggerMentor(
          "idle",
          `You're starting a new session on ${enrichedItem.concept.name}. I'll break it down for you. Let's focus!`,
        );
      }, 1000);
    } catch (error) {
      console.error("Error generating lesson content:", error);
      // Fallback content in case generation fails
      const fallbackItem = {
        ...item,
        concept: {
          ...item.concept,
          content:
            "Error: Could not generate the lesson right now. Please try refreshing or check your internet connection.",
        },
      };
      setSelectedConcept(fallbackItem);
      startStudySession(
        fallbackItem.concept as MicroConcept,
        fallbackItem.subject,
        "unknown",
      );
      setPhase("reading");
      setIsGeneratingQuestion(false);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    recordAnswer(correct);
    const newScore = {
      correct: score.correct + (correct ? 1 : 0),
      incorrect: score.incorrect + (correct ? 0 : 1),
      total: score.total + 1,
    };
    setScore(newScore);

    // Persist progress to Firestore
    if (user && selectedConcept) {
      try {
        const existing = await getProgressNode(
          user.uid,
          selectedConcept.concept.id,
        );
        const correctCount = (existing?.correctCount || 0) + (correct ? 1 : 0);
        const totalAttempts = (existing?.totalAttempts || 0) + 1;
        const mistakeCount = (existing?.mistakeCount || 0) + (correct ? 0 : 1);

        let status: ConceptStatus = "learning";
        const accuracy = totalAttempts > 0 ? correctCount / totalAttempts : 0;
        if (accuracy >= 0.9 && totalAttempts >= 3) status = "mastered";
        else if (accuracy >= 0.6) status = "review_24h";
        else if (totalAttempts > 0) status = "learning";
        else status = "new";

        await saveProgressNode(user.uid, {
          conceptId: selectedConcept.concept.id,
          subjectId: selectedConcept.subjectId,
          topicId: selectedConcept.topicId,
          status,
          correctCount,
          totalAttempts,
          mistakeCount,
          feynmanClarityScore: existing?.feynmanClarityScore || 0,
          lastTested: new Date(),
          nextReviewAt:
            status === "review_24h"
              ? new Date(Date.now() + 24 * 60 * 60 * 1000)
              : undefined,
        } as Parameters<typeof saveProgressNode>[2]);
      } catch (err) {
        console.error("Error saving progress:", err);
      }
    }

    if (correct) {
      setTimeout(() => setPhase("complete"), 500);
    } else {
      // 1. Give them 2 seconds to see the red "Incorrect" UI
      setTimeout(() => {
        setIsBlurring(true);
        setTimeout(() => {
          setPhase("feynman"); // Auto-route to Feynman Mode!
          setIsBlurring(false);
        }, 600);
      }, 2000);

      if (user && selectedConcept) {
        // Trigger dynamic explanation from AI mentor

        const metrics = useMetricsStore.getState();
        const config = {
          daysToExam: 40,
          predictedScore:
            score.total > 0 ? score.correct * 4 - score.incorrect * 1 : 245,
          streakDays: 5,
        };
        try {
          // We use fetch directly here to stream the response into the mentor store
          const context = {
            currentState: "Active Recall",
            currentTopic: selectedConcept.concept.name,
            timeSpent: "0m 0s",
            recentErrors: metrics.consecutiveErrors + 1,
            streak: config.streakDays,
            predictedScore: config.predictedScore,
            daysToExam: config.daysToExam,
            weaknesses: [],
            joinDate: "Unknown",
            targetScore: 300,
            prepLevel: "Unknown",
            favoriteSubject: "Unknown",
            importantMemories: [],
          };

                    useMentorStore.getState().startStreamingMentor("errors");

          const userId = user.uid;
          const idToken = await user.getIdToken();
          const cSessionId = currentSessionId || `session_${userId}`;

          const response = await fetch("/api/agent/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": userId,
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              userId: userId,
              sessionId: cSessionId,
              context,
              trigger: "errors",
              message: `The user just made a mistake on concept: ${selectedConcept.concept.name}. Please guide them.`,
            }),
          });

          if (!response.ok || !response.body) throw new Error("API Error");

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
                const dataStr = line.replace("data: ", "").trim();
                if (!dataStr) continue;
                try {
                  const data = JSON.parse(dataStr);
                  if (data.type === "done") {
                    // Handled by done block
                  } else if (data.type === "text" && data.text) {
                    useMentorStore.getState().appendStreamChunk(data.text);
                  } else if (data.text) {
                    useMentorStore.getState().appendStreamChunk(data.text);
                  }
                } catch { /* ignore parse error */ }
              }
            }
          }
        } catch {
          // Fallback if API fails
          triggerMentor(
            "errors",
            `You missed that one. Don't just memorize — understand WHY. Try Feynman Mode.`,
          );
        }
      } else {
        triggerMentor(
          "errors",
          `You missed that one. Don't just memorize — understand WHY. Try Feynman Mode.`,
        );
      }
    }
  };

  const handleFeynmanSubmit = async (explanation: string) => {
    setIsEvaluating(true);
    if (!selectedConcept) return;

    try {
      const response = await fetch("/api/feynman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: selectedConcept.concept.name,
          userExplanation: explanation,
        }),
      });

      if (!response.ok) throw new Error("Failed to evaluate explanation");

      const evaluation = await response.json();
      setFeynmanEval(evaluation);
    } catch (error) {
      console.error("Feynman evaluation error:", error);
      setFeynmanEval({
        clarityScore: 0,
        misunderstandings: [
          "An error occurred while evaluating your explanation.",
        ],
        strengths: [],
        feedback: "Please try again later.",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSkipToRecall = () => {
    setIsBlurring(true);
    setTimeout(() => {
      setPhase("recall");
      setIsBlurring(false);
      setTimer(0);
      startQuestion();
    }, 800);
  };

  const handleCompleteAndNext = async () => {
    // End Firestore session
    if (user && currentSessionId) {
      try {
        const metrics = useMetricsStore.getState();
        await endStudySession(user.uid, currentSessionId, {
          endTime: new Date(),
          conceptsStudied: selectedConcept ? [selectedConcept.concept.id] : [],
          questionsAttempted: metrics.questionsAttempted,
          correctAnswers: metrics.correctCount,
          averageSpeed: metrics.avgSecondsPerQuestion,
        });
      } catch (err) {
        console.error("Error ending study session:", err);
      }
    }

    setPhase("select");
    setSelectedConcept(null);
    setFeynmanEval(null);
    setCurrentSessionId(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <span className="ml-3 text-text-secondary font-medium">
          Loading concepts...
        </span>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8 max-w-screen-2xl mx-auto h-[calc(100vh-6rem)] animate-fade-in relative items-start">
      {/* Left Column: Study Engine Interface */}
      <div className="w-full h-full overflow-y-auto scrollbar-hide pb-20 pr-1">
        {/* Phase: Select Concept */}
        {phase === "select" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-brand-primary" />
                  Study Session
                </h1>
                <p className="text-[13px] tracking-[0.02em] font-medium text-text-secondary mt-2">
                  {syllabusTree
                    ? "Concepts from your syllabus. The AI adapts to your level."
                    : "Pick a concept to begin. The AI adapts to your level."}
                </p>
              </div>
              <CircularAccuracy correct={score.correct} total={score.total} />
            </div>

            {/* Abstracted loading phase logic that doesn't jump the layout: */}
            {isGeneratingContent ? (
              <LessonSkeleton />
            ) : (
              <div className="space-y-2 relative">
                {concepts.slice(0, 10).map((item) => (
                  <ConceptCard
                    key={item.concept.id}
                    name={item.concept.name}
                    subject={item.subject}
                    status={item.status}
                    mastery={item.mastery}
                    mistakeCount={item.mistakes}
                    lastTested="—"
                    onClick={() =>
                      !isGeneratingContent && handleSelectConcept(item)
                    }
                  />
                ))}
                {concepts.length === 0 && (
                  <Card className="p-8 text-center rounded-[24px]">
                    <p className="text-[13px] tracking-[0.02em] text-text-secondary font-medium">
                      No concepts found. Complete onboarding to upload your
                      syllabus.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Phase: Reading */}
        {phase === "reading" && selectedConcept && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="learning" dot>
                {selectedConcept.subject} · Level{" "}
                {selectedConcept.concept.difficulty}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipToRecall}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Skip to recall
              </Button>
            </div>
            <ReadingPane
              content={selectedConcept.concept.content}
              title={selectedConcept.concept.name}
              duration={dynamicReadingTime}
              timeElapsed={timer}
              onTimerComplete={handleSkipToRecall}
              isBlurring={isBlurring}
            />
          </div>
        )}

        {/* Phase: Active Recall */}
        {phase === "recall" && (
          <div className="space-y-4">
            <Badge variant="review" dot>
              Active Recall — Test Your Knowledge
            </Badge>
            {isGeneratingQuestion ? (
              <Card className="p-8 flex flex-col items-center justify-center rounded-[24px]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
                <p className="text-[13px] tracking-[0.02em] text-text-secondary font-medium">
                  Generating your question...
                </p>
              </Card>
            ) : currentQuestion ? (
              <ActiveRecallBox
                question={currentQuestion}
                onAnswer={handleAnswer}
                onRequestFeynman={() => setPhase("feynman")}
              />
            ) : (
              <ActiveRecallBox
                question={mockQuestion}
                onAnswer={handleAnswer}
                onRequestFeynman={() => setPhase("feynman")}
              />
            )}
          </div>
        )}

        {/* Phase: Feynman Mode */}
        {phase === "feynman" && selectedConcept && (
          <div className="space-y-4">
            <Badge variant="learning" dot>
              Feynman Mode — Explain It Simply
            </Badge>
            <FeynmanInput
              conceptName={selectedConcept.concept.name}
              onSubmit={handleFeynmanSubmit}
              evaluation={feynmanEval}
              isEvaluating={isEvaluating}
            />
          </div>
        )}

        {/* Phase: Complete */}
        {phase === "complete" && (
          <div className="flex flex-col items-center justify-center py-20 animate-slide-up">
            <div className="w-24 h-24 rounded-[32px] bg-success/10 flex items-center justify-center mb-8 shadow-sm">
              <Trophy className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-3xl font-display font-bold text-text-primary mb-3">
              Concept Mastered! 🎯
            </h2>
            <p className="text-[14px] font-medium text-text-secondary mb-3">
              +4 points · Scheduled for 24h review
            </p>
            <div className="flex items-center gap-3 mb-10">
              <Badge variant="mastered" dot>
                Level Up
              </Badge>
              <span className="text-[12px] uppercase tracking-[0.15em] font-bold text-text-muted">
                Score: {score.correct * 4 - score.incorrect}/
                {(score.correct + score.incorrect) * 4}
              </span>
            </div>
            <Button
              onClick={handleCompleteAndNext}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Next Concept
            </Button>
          </div>
        )}
      </div>

      {/* Right Column: Embedded AI Mentor */}
      <div className="hidden lg:block h-full w-full sticky top-0 pb-6 rounded-[24px]">
        <StudyMentorPanel />
      </div>
    </div>
  );
}
