"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import KineticScoreDisplay from "@/components/analytics/KineticScoreDisplay";
import SpeedCharts from "@/components/analytics/SpeedCharts";
import { usePredictedScore } from "@/hooks/usePredictedScore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import {
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  Zap,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Flame,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getDashboardStats,
  getWeakTopics,
  getRecentActivity,
  getStudySessions,
  updateStreak,
  getWeeklySpeedAccuracy,
} from "@/lib/firebase/firestore";

// Fallback mock data
const fallbackSpeedData = [
  { label: "Mon", value: 1.2 },
  { label: "Tue", value: 1.5 },
  { label: "Wed", value: 1.1 },
  { label: "Thu", value: 1.8 },
  { label: "Fri", value: 2.0 },
  { label: "Sat", value: 1.7 },
  { label: "Sun", value: 2.2 },
];

const fallbackAccuracyData = [
  { label: "Mon", value: 65 },
  { label: "Tue", value: 72 },
  { label: "Wed", value: 68 },
  { label: "Thu", value: 78 },
  { label: "Fri", value: 82 },
  { label: "Sat", value: 75 },
  { label: "Sun", value: 85 },
];

interface DashboardData {
  conceptsLearned: number;
  todayStudyHours: string;
  accuracy: number;
  avgSpeed: number;
  weakTopics: Array<{ name: string; mastery: number; attempts: number }>;
  todaysPlan: Array<{
    id: string;
    concept: string;
    subject: string;
    status: "new" | "learning" | "review" | "mastered";
    time: string;
  }>;
  recentActivity: Array<{
    action: string;
    topic: string;
    result: "correct" | "incorrect";
    time: string;
  }>;
  speedData: Array<{ label: string; value: number }>;
  accuracyData: Array<{ label: string; value: number }>;
}

export default function DashboardPage() {
  const { prediction, delta } = usePredictedScore();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const syllabusTree = useAuthStore((s) => s.syllabusTree);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate days until exam (safe against invalid dates & Firestore Timestamps)
  const parseExamDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (typeof d?.toDate === "function") return d.toDate(); // Firestore Timestamp
    if (typeof d?.seconds === "number") return new Date(d.seconds * 1000); // Firestore Timestamp plain object
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };
  const rawExamDate = parseExamDate(profile?.examDate);
  const daysUntilExam = rawExamDate
    ? Math.max(
        0,
        Math.ceil(
          (rawExamDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : "—";

  // Load dashboard data from Firestore
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Update streak on dashboard visit
        updateStreak(user.uid).catch(console.error);

        const [stats, weakTopics, activity, weeklyCharts] = await Promise.all([
          getDashboardStats(user.uid),
          getWeakTopics(user.uid, 3),
          getRecentActivity(user.uid, 5),
          getWeeklySpeedAccuracy(user.uid),
        ]);

        // Build today's plan from syllabus tree (first few concepts)
        const todaysPlan: DashboardData["todaysPlan"] = [];
        if (syllabusTree?.tree) {
          planLoop: for (const subject of syllabusTree.tree) {
            for (const topic of subject.topics || []) {
              for (const subTopic of topic.subTopics || []) {
                for (const mc of subTopic.microConcepts || []) {
                  todaysPlan.push({
                    id: mc.id || mc.name,
                    concept: mc.name,
                    subject: subject.name,
                    status: "new" as const,
                    time: "—",
                  });
                  if (todaysPlan.length >= 4) break planLoop;
                }
              }
            }
          }
        }

        // If no syllabus, use default plan
        if (todaysPlan.length === 0) {
          if (profile?.onboardingComplete) {
            todaysPlan.push({
              id: "1",
              concept: "Start studying to generate your plan",
              subject: "Get Started",
              status: "new",
              time: "—",
            });
          } else {
            todaysPlan.push({
              id: "1",
              concept: "Complete your onboarding",
              subject: "Setup",
              status: "new",
              time: "—",
            });
          }
        }

        // Enrich weak topics with concept names from syllabus
        const enrichedWeakTopics = weakTopics.map((wt) => {
          let name = wt.conceptId;
          if (syllabusTree?.tree) {
            searchLoop: for (const subject of syllabusTree.tree) {
              for (const topic of subject.topics || []) {
                for (const subTopic of topic.subTopics || []) {
                  for (const mc of subTopic.microConcepts || []) {
                    if (
                      (mc.id || mc.name?.toLowerCase().replace(/\s+/g, "-")) ===
                      wt.conceptId
                    ) {
                      name = `${subject.name} — ${mc.name}`;
                      break searchLoop;
                    }
                  }
                }
              }
            }
          }
          return { name, mastery: wt.mastery, attempts: wt.attempts };
        });

        const todayHours = (stats.todayStudyMinutes / 60).toFixed(1);

        setData({
          conceptsLearned: stats.conceptsLearned,
          todayStudyHours: todayHours,
          accuracy: stats.overallAccuracy,
          avgSpeed:
            stats.averageSpeed > 0
              ? Math.round((60 / stats.averageSpeed) * 10) / 10
              : 0,
          weakTopics: enrichedWeakTopics,
          todaysPlan,
          recentActivity:
            activity.length > 0
              ? activity
              : [
                  {
                    action: "No activity yet",
                    topic: "Start studying!",
                    result: "correct" as const,
                    time: "Now",
                  },
                ],
          speedData: weeklyCharts.speedData,
          accuracyData: weeklyCharts.accuracyData,
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, syllabusTree, profile?.onboardingComplete]);

  // Use fallback while loading
  const displayData = data || {
    conceptsLearned: 0,
    todayStudyHours: "0",
    accuracy: 0,
    avgSpeed: 0,
    weakTopics: [],
    todaysPlan: [],
    recentActivity: [],
    speedData: fallbackSpeedData,
    accuracyData: fallbackAccuracyData,
  };

  return (
    <div className="w-full mx-auto space-y-6 md:space-y-8 animate-fade-in pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-5 border-b border-border-subtle">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-text-muted">
            Overview
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary tracking-tight">
            Good evening, {profile?.displayName?.split(" ")[0] || "Student"}{" "}
            <span className="inline-block">🌅</span>
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-100 rounded-md border border-border-subtle">
              <Calendar className="w-3 h-3 text-text-secondary" />
              <span className="text-[11px] font-semibold text-text-primary">
                {daysUntilExam} days to exam
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-50/50 rounded-md border border-orange-100">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-[11px] font-semibold text-orange-600">
                {(() => {
                  const streak = profile?.streak;
                  if (!streak?.current || !streak?.lastActive) return 0;
                  const lastActive =
                    streak.lastActive instanceof Date
                      ? streak.lastActive
                      : (streak.lastActive as any)?.toDate?.() ||
                        new Date(streak.lastActive);
                  const now = new Date();
                  const lastDay = new Date(
                    lastActive.getFullYear(),
                    lastActive.getMonth(),
                    lastActive.getDate(),
                  );
                  const today = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                  );
                  const daysDiff = Math.floor(
                    (today.getTime() - lastDay.getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return daysDiff <= 1 ? streak.current : 0;
                })()}{" "}
                day streak
              </span>
            </div>
            {profile?.favoriteSubject && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-primary/5 rounded-md border border-brand-primary/10">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span className="text-[11px] font-semibold text-brand-primary">
                  Focus: {profile.favoriteSubject}
                </span>
              </div>
            )}
            {profile?.dailyStudyTime && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-100 rounded-md border border-border-subtle">
                <Clock className="w-3 h-3 text-text-secondary" />
                <span className="text-[11px] font-semibold text-text-primary">
                  Goal: {profile.dailyStudyTime}h/day
                </span>
              </div>
            )}
          </div>
        </div>
        <Link href="/study">
          <Button
            icon={<BookOpen className="w-4 h-4" />}
            size="md"
            className="w-full md:w-auto"
          >
            Start Session
          </Button>
        </Link>
      </div>

      {/* Top Row: Score + Quick Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Kinetic Score Display */}
        <div className="xl:col-span-1 border border-border-default rounded-xl overflow-hidden bg-white p-0">
          <KineticScoreDisplay
            score={prediction.totalScore}
            maxScore={prediction.maxScore}
            delta={delta}
          />
        </div>

        {/* Quick Stats Grid */}
        <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            className="flex flex-col mb-0 justify-between p-4 bg-white border border-border-default rounded-xl"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center border border-border-default mb-3">
              <BookOpen className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-text-primary tracking-tight">
                {displayData.conceptsLearned}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-1">
                Concepts learned
              </p>
            </div>
          </Card>

          <Card
            className="flex flex-col mb-0 justify-between p-4 bg-white border border-border-default rounded-xl"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center border border-border-default mb-3">
              <Clock className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-text-primary tracking-tight">
                {displayData.todayStudyHours}
                <span className="text-lg ml-0.5 text-text-muted">h</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-1">
                Today&apos;s study
              </p>
            </div>
          </Card>

          <Card
            className="flex flex-col mb-0 justify-between p-4 bg-white border border-border-default rounded-xl"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center border border-border-default mb-3">
              <Target className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-text-primary tracking-tight">
                {displayData.accuracy}
                <span className="text-lg ml-0.5 text-text-muted">%</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-1">
                Accuracy rate
              </p>
            </div>
          </Card>

          <Card
            className="flex flex-col mb-0 justify-between p-4 bg-white border border-border-default rounded-xl"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center border border-border-default mb-3">
              <TrendingUp className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-text-primary tracking-tight">
                {displayData.avgSpeed}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-1">
                QPM speed
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Middle Row: Charts + Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Speed & Accuracy Charts */}
        <div className="lg:col-span-2 border border-border-default rounded-xl overflow-hidden bg-white p-5">
          <SpeedCharts
            speedData={displayData.speedData}
            accuracyData={displayData.accuracyData}
          />
        </div>

        {/* Weak Topics */}
        <Card className="p-5 bg-white border border-border-default rounded-xl flex flex-col">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-1.5 bg-red-50 rounded-lg text-red-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">
                Priority Focus
              </h3>
              <p className="text-[11px] font-medium text-text-muted">
                Topics needing attention
              </p>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            {displayData.weakTopics.length > 0 ? (
              displayData.weakTopics.map((topic, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-semibold text-text-primary truncate flex-1 group-hover:text-brand-primary transition-colors">
                      {topic.name}
                    </span>
                    <span
                      className={`text-[13px] font-bold ml-3 ${topic.mastery < 40 ? "text-red-500" : "text-orange-500"}`}
                    >
                      {topic.mastery}%
                    </span>
                  </div>
                  <ProgressBar
                    value={topic.mastery}
                    variant={topic.mastery < 40 ? "danger" : "warning"}
                    size="sm"
                    className="bg-surface-100"
                  />
                  <div className="mt-1 flex justify-end">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted">
                      {topic.attempts} attempts
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-text-muted font-medium">
                Start studying to see weak areas here.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Today's Plan + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Study Plan */}
        <Card className="p-5 bg-white border border-border-default rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center bg-brand-primary/10 rounded-lg text-brand-primary border border-brand-primary/20">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[13px] uppercase tracking-widest font-semibold text-text-muted mb-0.5">
                  Today&apos;s Plan
                </h3>
                <p className="text-xl font-display font-medium text-text-primary tracking-tight">
                  {displayData.todaysPlan.length} concepts planned
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {displayData.todaysPlan.map((item) => (
              <Link
                key={item.id}
                href="/study"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-border-default hover:border-brand-primary/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge
                    variant={item.status}
                    size="sm"
                    className="hidden sm:inline-flex w-16 justify-center uppercase tracking-wider text-[9px] font-bold"
                  >
                    {item.status}
                  </Badge>
                  <div className="flex-col min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {item.concept}
                    </p>
                    <p className="text-[11px] font-medium text-text-muted mt-0.5">
                      {item.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-5 bg-white border border-border-default rounded-xl">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 flex items-center justify-center bg-surface-50 rounded-lg text-text-secondary border border-border-default">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[13px] uppercase tracking-widest font-semibold text-text-muted mb-0.5">
                Recent Activity
              </h3>
              <p className="text-xl font-display font-medium text-text-primary tracking-tight">
                Latest actions
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {displayData.recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-border-default"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.result === "correct" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                >
                  {item.result === "correct" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {item.action}
                  </p>
                  <p className="text-[11px] font-medium text-text-muted mt-0.5">
                    {item.topic}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted flex-shrink-0 pr-1">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
