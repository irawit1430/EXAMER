"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Loader2, ArrowRight, CheckCircle2, Trophy, Clock } from "lucide-react";
import type { QuizQuestion } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { saveProgressNode, createStudySession, endStudySession } from "@/lib/firebase/firestore";

export default function MockTestTakingPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const testName = searchParams?.get("name") || "Mock Test";
  const subjects = searchParams?.get("subjects") || "General";
  const numQuestions = parseInt(searchParams?.get("q") || "10", 10);

  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Ref to track session for graceful cleanup on unmount/tab close
  const activeSessionRef = useRef<{ id: string | null; uid: string | null; timer: number; questions: QuizQuestion[]; answers: Record<string, string> }>({
    id: null,
    uid: null,
    timer: 0,
    questions: [],
    answers: {},
  });

  useEffect(() => {
    activeSessionRef.current = {
      id: currentSessionId,
      uid: user?.uid || null,
      timer,
      questions,
      answers,
    };
  }, [currentSessionId, user, timer, questions, answers]);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const idToken = user ? await user.getIdToken() : null;
        
        const res = await fetch("/api/mocks/questions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {})
          },
          body: JSON.stringify({ subjects, count: numQuestions }),
        });
        if (!res.ok) throw new Error("Failed to load questions");
        const data = await res.json();
        setQuestions(data.questions || []);

        if (user && data.questions && data.questions.length > 0) {
          const sessionId = await createStudySession(user.uid, {
            conceptsStudied: data.questions.map((q: any) => q.conceptId || "mock"),
            startTime: new Date(),
            endTime: new Date(), // Temporary, will be updated on finish or unmount
            questionsAttempted: 0,
            correctAnswers: 0,
            averageSpeed: 0,
          });
          setCurrentSessionId(sessionId);
        }
      } catch (err) {
        console.error("Error loading mock questions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [subjects, numQuestions, user]);

  // Graceful cleanup on tab close / unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      const active = activeSessionRef.current;
      if (active.id && active.uid) {
        // Calculate current stats realistically before unloading
        let correct = 0;
        let attempted = 0;
        Object.entries(active.answers).forEach(([qId, ansId]) => {
          const q = active.questions.find(qu => qu.id === qId);
          if (q) {
            attempted++;
            if (q.options.find(o => o.isCorrect)?.id === ansId) correct++;
          }
        });

        endStudySession(active.uid, active.id, {
          endTime: new Date(),
          conceptsStudied: active.questions.map(q => q.conceptId || "mock"),
          questionsAttempted: attempted,
          correctAnswers: correct,
          averageSpeed: attempted > 0 ? active.timer / attempted : 0,
        }).catch(console.error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload(); // Save final time immediately upon navigating away
    };
  }, []);

  // Basic timer
  useEffect(() => {
    if (loading || isFinished) return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, isFinished]);

  const handleSelectOption = (optionId: string) => {
    setAnswers({ ...answers, [questions[currentIdx].id]: optionId });
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    setIsFinished(true);
    // Calculate final score
    let correct = 0;
    let incorrect = 0;
    
    questions.forEach((q) => {
      const selected = answers[q.id];
      const correctOpt = q.options.find(o => o.isCorrect)?.id;
      if (selected === correctOpt) correct++;
      else if (selected) incorrect++;
    });

    // Optionally update progress nodes if user exists. We use a batch simulation
    // Since Mock test spans across multiple concepts, we just update the specific concepts tested
    if (user) {
       for (const q of questions) {
         const selected = answers[q.id];
         const isCorrect = selected === q.options.find(o => o.isCorrect)?.id;
         if (selected && q.conceptId) {
            // we do a blind set for mock simulation speed. (ideal app would read and increment properly)
            await saveProgressNode(user.uid, {
              conceptId: q.conceptId,
              status: isCorrect ? "review_24h" : "learning",
              correctCount: isCorrect ? 1 : 0,
              totalAttempts: 1,
              mistakeCount: isCorrect ? 0 : 1,
              feynmanClarityScore: 0,
              lastTested: new Date(),
            } as any).catch(() => {});
         }
       }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-text-primary">Generating Mock Test...</h2>
        <p className="text-sm font-medium text-text-secondary mt-1">This might take a minute.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Failed to load questions. Please try again.</p>
      </div>
    );
  }

  if (isFinished) {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    questions.forEach((q) => {
      const selected = answers[q.id];
      const correctOpt = q.options.find(o => o.isCorrect)?.id;
      if (!selected) unattempted++;
      else if (selected === correctOpt) correct++;
      else incorrect++;
    });

    const marks = (correct * 4) - (incorrect * 1);

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-10">
        <div className="flex flex-col items-center justify-center p-10 bg-surface-50 border border-border-subtle rounded-3xl shadow-sm">
           <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-success" />
           </div>
           <h1 className="text-4xl font-display font-bold text-text-primary mb-2">Test Completed</h1>
           <p className="text-text-secondary font-medium mb-8">Score: {marks} / {questions.length * 4}</p>
           
           <div className="flex gap-4 w-full text-center">
             <div className="flex-1 p-4 bg-surface-100 rounded-2xl">
               <div className="text-2xl font-bold text-success">{correct}</div>
               <div className="text-xs uppercase tracking-wider text-text-muted mt-1">Correct (+4)</div>
             </div>
             <div className="flex-1 p-4 bg-surface-100 rounded-2xl">
               <div className="text-2xl font-bold text-danger">{incorrect}</div>
               <div className="text-xs uppercase tracking-wider text-text-muted mt-1">Incorrect (-1)</div>
             </div>
             <div className="flex-1 p-4 bg-surface-100 rounded-2xl">
               <div className="text-2xl font-bold text-text-secondary">{unattempted}</div>
               <div className="text-xs uppercase tracking-wider text-text-muted mt-1">Unattempted</div>
             </div>
           </div>
           
           <Button onClick={() => window.location.href = "/dashboard"} className="mt-8">Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const question = questions[currentIdx];
  const selectedOption = answers[question.id];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">{testName}</h1>
          <p className="text-sm text-text-secondary mt-1">Question {currentIdx + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-100 rounded-xl font-mono text-text-primary font-semibold">
           <Clock className="w-4 h-4 text-text-muted" />
           {formatTime(timer)}
        </div>
      </div>

      <Card padding="lg">
        <h2 className="text-xl font-semibold text-text-primary mb-8 leading-relaxed">
          {currentIdx + 1}. {question.question}
        </h2>

        <div className="space-y-4 mb-10">
          {question.options.map((option, i) => (
             <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200
                   ${selectedOption === option.id ? "border-brand-primary/50 bg-brand-primary/5 shadow-sm" : "border-border-subtle hover:border-brand-primary/30 hover:bg-surface-50"}
                `}
             >
                <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold flex-shrink-0 transition-colors
                   ${selectedOption === option.id ? "bg-brand-primary text-white" : "bg-surface-200 text-text-muted"}
                `}>
                   {selectedOption === option.id ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                </div>
                <span className="text-base font-medium text-text-secondary">{option.text}</span>
             </button>
          ))}
        </div>

        <div className="flex items-center justify-end">
           <Button
             onClick={handleNext}
             icon={<ArrowRight className="w-4 h-4" />}
           >
             {currentIdx === questions.length - 1 ? "Finish Test" : "Next Question"}
           </Button>
        </div>
      </Card>
      
      {/* Progress navigation strip */}
      <div className="flex flex-wrap gap-2">
         {questions.map((q, i) => (
            <button
               key={q.id}
               onClick={() => setCurrentIdx(i)}
               className={`w-8 h-8 flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-colors
                  ${currentIdx === i ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-surface-50" : ""}
                  ${answers[q.id] ? "bg-brand-primary text-white" : "bg-surface-100 text-text-muted hover:bg-surface-200"}
               `}
            >
               {i + 1}
            </button>
         ))}
      </div>
    </div>
  );
}
