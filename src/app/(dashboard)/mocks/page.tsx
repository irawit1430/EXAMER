"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { FileText, Clock, Target, Play, Lock, Loader2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getMockTests,
  saveMockTests,
  getMasteredConceptsCount,
  type MockTest,
} from "@/lib/firebase/firestore";

// Fallback mock tests if Firestore collection is empty
const fallbackMockTests = [
  {
    id: "1",
    name: "CUET Mathematics Mock",
    questions: 50,
    duration: "60 min",
    difficulty: "Medium" as const,
    subjects: ["Mathematics"],
    unlockCriteria: { minConceptsMastered: 0 },
  },
  {
    id: "2",
    name: "CUET Physics Focus",
    questions: 50,
    duration: "60 min",
    difficulty: "Hard" as const,
    subjects: ["Physics"],
    unlockCriteria: { minConceptsMastered: 10 },
  },
  {
    id: "3",
    name: "CUET Chemistry Focus",
    questions: 50,
    duration: "60 min",
    difficulty: "Hard" as const,
    subjects: ["Chemistry"],
    unlockCriteria: { minConceptsMastered: 20 },
  },
  {
    id: "4",
    name: "CUET Full Mock",
    questions: 150,
    duration: "180 min",
    difficulty: "Medium" as const,
    subjects: ["Physics", "Chemistry", "Mathematics"],
    unlockCriteria: { minConceptsMastered: 10 },
  },
];

export default function MocksPage() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [conceptsMastered, setConceptsMastered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        // Try to load mock tests from Firestore
        const firestoreTests = await getMockTests(user.uid);
        setTests(
          firestoreTests.length > 0 ? firestoreTests : fallbackMockTests,
        );

        // Get mastered concepts count for unlock criteria
        const mastered = await getMasteredConceptsCount(user.uid);
        setConceptsMastered(mastered);
      } catch (err) {
        console.error("Error loading mock tests:", err);
        setTests(fallbackMockTests);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!user || !profile) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/mocks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetExam: profile.targetExam,
          favoriteSubject: profile.favoriteSubject,
          targetScore: profile.targetScore,
          prepLevel: profile.prepLevel,
          dailyStudyTime: profile.dailyStudyTime,
          syllabus: profile.syllabus,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate mock tests");
      const generatedTests = await res.json();
      
      // Cache them to firestore
      await saveMockTests(user.uid, generatedTests);
      setTests(generatedTests);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while generating mock tests.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand-primary" />
            Mock Tests
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-2">
            Simulate full exam conditions. Your predicted score updates after each
            mock.
          </p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={generating}
          icon={generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          className="flex-shrink-0"
        >
          {generating ? "Generating..." : "Generate AI Mocks"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map((test) => {
          const unlocked =
            conceptsMastered >= (test.unlockCriteria?.minConceptsMastered || 0);
          return (
            <Card
              key={test.id}
              hover
              padding="md"
              className={unlocked ? "" : "opacity-60"}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {test.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> {test.questions}{" "}
                      questions
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {test.duration}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={test.difficulty === "Hard" ? "review" : "learning"}
                  size="sm"
                >
                  {test.difficulty}
                </Badge>
              </div>
              <Button
                size="sm"
                className="w-full"
                disabled={!unlocked}
                variant={unlocked ? "primary" : "secondary"}
                onClick={() => {
                  if (unlocked) {
                    window.location.href = `/mocks/${test.id}?name=${encodeURIComponent(test.name)}&subjects=${encodeURIComponent(test.subjects.join(","))}&q=${test.questions}`;
                  }
                }}
                icon={
                  unlocked ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )
                }
              >
                {unlocked
                  ? "Start Mock"
                  : `Master ${test.unlockCriteria?.minConceptsMastered || 0} concepts to unlock`}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
