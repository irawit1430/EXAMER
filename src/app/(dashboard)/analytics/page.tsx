"use client";

import React, { useState, useEffect } from "react";
import KineticScoreDisplay from "@/components/analytics/KineticScoreDisplay";
import SpeedCharts from "@/components/analytics/SpeedCharts";
import { usePredictedScore } from "@/hooks/usePredictedScore";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Brain,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getDashboardStats,
  getAllProgressNodes,
  getStudySessions,
  getWeeklySpeedAccuracy,
} from "@/lib/firebase/firestore";

interface AnalyticsData {
  totalQuestions: number;
  totalHours: number;
  avgQPM: number;
  conceptsMastered: number;
  subjectBreakdown: Array<{
    name: string;
    mastery: number;
    concepts: number;
    attempted: number;
  }>;
  timeDistribution: Array<{
    subject: string;
    hours: number;
    percentage: number;
  }>;
  weeklySpeed: Array<{ label: string; value: number }>;
  weeklyAccuracy: Array<{ label: string; value: number }>;
}

const subjectColors = ["#6366f1", "#22d3ee", "#10b981", "#8b5cf6", "#f59e0b"];

const fallbackSpeedData = [
  { label: "W1", value: 1.0 },
  { label: "W2", value: 1.3 },
  { label: "W3", value: 1.5 },
  { label: "W4", value: 1.4 },
  { label: "W5", value: 1.8 },
  { label: "W6", value: 2.0 },
  { label: "W7", value: 2.2 },
];

const fallbackAccuracyData = [
  { label: "W1", value: 55 },
  { label: "W2", value: 62 },
  { label: "W3", value: 68 },
  { label: "W4", value: 65 },
  { label: "W5", value: 75 },
  { label: "W6", value: 78 },
  { label: "W7", value: 85 },
];

export default function AnalyticsPage() {
  const { prediction, delta } = usePredictedScore();
  // ⚡ Bolt: Use fine-grained selectors to prevent unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const syllabusTree = useAuthStore((state) => state.syllabusTree);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [stats, progressNodes, weeklyCharts] = await Promise.all([
          getDashboardStats(user.uid),
          getAllProgressNodes(user.uid),
          getWeeklySpeedAccuracy(user.uid),
        ]);

        // Build subject breakdown from progress nodes + syllabus tree
        const subjectMap: Record<
          string,
          {
            name: string;
            correct: number;
            total: number;
            concepts: number;
            attempted: number;
          }
        > = {};

        if (syllabusTree?.tree) {
          for (const subject of syllabusTree.tree) {
            const subjectId =
              subject.id ||
              subject.name?.toLowerCase().replace(/\s+/g, "-") ||
              "unknown";

            let totalConcepts = 0;
            const topics = subject.topics;
            if (topics) {
              for (let i = 0, len = topics.length; i < len; i++) {
                const subTopics = topics[i].subTopics;
                if (subTopics) {
                  for (let j = 0, subLen = subTopics.length; j < subLen; j++) {
                    const microConcepts = subTopics[j].microConcepts;
                    if (microConcepts) {
                      totalConcepts += microConcepts.length;
                    }
                  }
                }
              }
            }

            subjectMap[subjectId] = {
              name: subject.name,
              correct: 0,
              total: 0,
              concepts: totalConcepts,
              attempted: 0,
            };
          }
        }

        // Populate with progress data
        for (const node of progressNodes) {
          const sId = (node as any).subjectId;
          if (sId && subjectMap[sId]) {
            subjectMap[sId].correct += node.correctCount;
            subjectMap[sId].total += node.totalAttempts;
            subjectMap[sId].attempted += 1;
          }
        }

        const subjectBreakdown = Object.values(subjectMap).map((s) => ({
          name: s.name,
          mastery: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
          concepts: s.concepts,
          attempted: s.attempted,
        }));

        // Build time distribution (equal for now, will be refined later)
        const totalSubjects = subjectBreakdown.length || 1;
        const hoursPerSubject = stats.totalStudyHours / totalSubjects;
        const timeDistribution = subjectBreakdown.map((s) => ({
          subject: s.name,
          hours: Math.round(hoursPerSubject * 10) / 10,
          percentage: Math.round(100 / totalSubjects),
        }));

        const avgSpeed =
          stats.averageSpeed > 0
            ? Math.round((60 / stats.averageSpeed) * 10) / 10
            : 0;

        setData({
          totalQuestions: stats.totalQuestionsAttempted,
          totalHours: stats.totalStudyHours,
          avgQPM: avgSpeed,
          conceptsMastered: stats.conceptsMastered,
          subjectBreakdown,
          timeDistribution,
          weeklySpeed: weeklyCharts.speedData,
          weeklyAccuracy: weeklyCharts.accuracyData,
        });
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [user, syllabusTree]);

  const fallbackEmpty = [
    { label: "Mon", value: 0 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 0 },
    { label: "Fri", value: 0 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 0 },
  ];
  const displayData = data || {
    totalQuestions: 0,
    totalHours: 0,
    avgQPM: 0,
    conceptsMastered: 0,
    subjectBreakdown: [],
    timeDistribution: [],
    weeklySpeed: fallbackEmpty,
    weeklyAccuracy: fallbackEmpty,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  const weeklySpeed = displayData.weeklySpeed;
  const weeklyAccuracy = displayData.weeklyAccuracy;
  const subjects = displayData.subjectBreakdown;

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-border-default">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-text-muted">
            Performance
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary tracking-tight">
            Analytics
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 border border-border-default rounded-2xl overflow-hidden bg-white shadow-sm p-1">
          <KineticScoreDisplay
            score={prediction.totalScore}
            maxScore={prediction.maxScore}
            delta={delta}
          />
        </div>
        <div className="xl:col-span-2 border border-border-default rounded-2xl overflow-hidden bg-white shadow-sm p-5">
          <SpeedCharts speedData={weeklySpeed} accuracyData={weeklyAccuracy} />
        </div>
      </div>

      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overall Stats */}
        <Card padding="md" className="flex flex-col justify-between">
          <h3 className="text-sm font-bold tracking-wider uppercase text-text-muted mb-6">
            Lifetime Stats
          </h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Target className="w-4 h-4" /> Total Questions
              </span>
              <span className="text-xl font-display font-bold text-text-primary">
                {displayData.totalQuestions}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Clock className="w-4 h-4" /> Total Hours
              </span>
              <span className="text-xl font-display font-bold text-text-primary">
                {displayData.totalHours}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Avg QPM
              </span>
              <span className="text-xl font-display font-bold text-accent-cyan">
                {displayData.avgQPM}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Brain className="w-4 h-4" /> Concepts Mastered
              </span>
              <span className="text-xl font-display font-bold text-success">
                {displayData.conceptsMastered}
              </span>
            </div>
          </div>
        </Card>

        {/* Time Distribution */}
        <Card padding="md">
          <h3 className="text-sm font-bold tracking-wider uppercase text-text-muted mb-6">
            Time Distribution
          </h3>
          <div className="space-y-4">
            {displayData.timeDistribution.length > 0 ? (
              displayData.timeDistribution.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            subjectColors[i % subjectColors.length],
                        }}
                      />
                      <span className="text-sm font-semibold text-text-secondary">
                        {item.subject}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-text-muted">
                      {item.hours}h
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor:
                          subjectColors[i % subjectColors.length],
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted font-medium">
                Start studying to see time distribution.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Subject Breakdown */}
      <Card padding="md">
        <h3 className="text-base font-bold text-text-primary mb-6">
          Subject-wise Breakdown
        </h3>
        <div className="space-y-5">
          {displayData.subjectBreakdown.length > 0 ? (
            displayData.subjectBreakdown.map((subject) => (
              <div key={subject.name} className="flex items-center gap-5">
                <span className="text-sm font-semibold text-text-secondary w-36 truncate">
                  {subject.name}
                </span>
                <div className="flex-1">
                  <ProgressBar
                    value={subject.mastery}
                    variant={
                      subject.mastery >= 80
                        ? "success"
                        : subject.mastery >= 60
                          ? "brand"
                          : "warning"
                    }
                    size="md"
                  />
                </div>
                <span className="text-sm font-bold text-text-primary w-12 text-right">
                  {subject.mastery}%
                </span>
                <Badge
                  variant={
                    subject.mastery >= 80
                      ? "mastered"
                      : subject.mastery >= 60
                        ? "learning"
                        : "review"
                  }
                  size="sm"
                >
                  {subject.attempted}/{subject.concepts}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted font-medium">
              Complete onboarding and start studying to see subject breakdown.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
