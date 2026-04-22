"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Button from "@/components/ui/Button";
import { Brain } from "lucide-react";
import { saveSyllabusTree } from "@/lib/firebase/firestore";

// Steps
import Step1SyllabusUpload from "./steps/Step1SyllabusUpload";
import Step2MCQTest from "./steps/Step2MCQTest";
import Step3FavoriteSubject from "./steps/Step3FavoriteSubject";
import Step4StudyTime from "./steps/Step4StudyTime";
import Step5PrepLevel from "./steps/Step5PrepLevel";
import Step6Personalize from "./steps/Step6Personalize";

export type OnboardingData = {
  syllabus: string;
  targetExam: string;
  favoriteSubject: string;
  dailyStudyTime: string;
  prepLevel: string;
  personalizedAnswers: Record<string, string>;
  diagnosticAnswers: Record<string, string>;
};

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    syllabus: "",
    targetExam: "",
    favoriteSubject: "",
    dailyStudyTime: "",
    prepLevel: "",
    personalizedAnswers: {},
    diagnosticAnswers: {},
  });

  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 6));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleUpdateData = (patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Not authenticated");

      // 1. Generate Study Routine via AI using the collected data
      let generatedRoutine = null;
      if (data.syllabus) {
        try {
          const response = await fetch("/api/routine/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            generatedRoutine = await response.json();
          } else {
            console.error("Failed to generate routine from API");
          }
        } catch (apiError) {
          console.error("API Error during routine generation:", apiError);
        }
      }

      // 2. Save parsed syllabus tree to Firestore subcollection
      if (data.syllabus) {
        try {
          const parsedSyllabus = JSON.parse(data.syllabus);
          // Wrap in Subject array format if needed
          const tree = Array.isArray(parsedSyllabus)
            ? parsedSyllabus
            : [parsedSyllabus];
          await saveSyllabusTree(user.uid, tree);
        } catch (parseErr) {
          console.error("Error saving syllabus tree:", parseErr);
        }
      }

      // 3. Extract exam date from personalized answers (q3 is the date question)
      const examDateStr = data.personalizedAnswers?.q3;
      const examDate = examDateStr ? new Date(examDateStr) : new Date();
      const targetExam = data.personalizedAnswers?.targetExam || "General Exam";

      // 4. Save everything to Firestore via AuthStore
      await updateProfile({
        onboardingComplete: true,
        ...data,
        targetExam,
        examDate: isNaN(examDate.getTime()) ? new Date() : examDate,
        studyRoutine: generatedRoutine,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-5 animate-slide-up min-h-screen flex flex-col justify-center">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 shadow-sm shadow-brand-primary/10">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-display font-bold text-text-primary">
          Configure Your AI Mentor
        </h1>
        <p className="text-[12px] text-text-secondary mt-1">
          Let's personalize your learning journey for maximum retention and top
          scores.
        </p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-primary">
            Step {currentStep} of 6
          </span>
        </div>
        <div className="w-full bg-surface-200 h-1 rounded-full overflow-hidden">
          <div
            className="bg-brand-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      <div className="glass-card p-1 border border-border-subtle shadow-sm relative overflow-hidden">
        <div className="bg-white/50 backdrop-blur-md rounded-xl p-5 sm:p-6 min-h-[380px] flex flex-col justify-between">
          <div className="flex-1">
            {currentStep === 1 && (
              <Step1SyllabusUpload data={data} updateData={handleUpdateData} />
            )}
            {currentStep === 2 && (
              <Step2MCQTest
                data={data}
                updateData={handleUpdateData}
                onComplete={handleNext}
              />
            )}
            {currentStep === 3 && (
              <Step3FavoriteSubject data={data} updateData={handleUpdateData} />
            )}
            {currentStep === 4 && (
              <Step4StudyTime data={data} updateData={handleUpdateData} />
            )}
            {currentStep === 5 && (
              <Step5PrepLevel data={data} updateData={handleUpdateData} />
            )}
            {currentStep === 6 && (
              <Step6Personalize data={data} updateData={handleUpdateData} />
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-border-default flex justify-between items-center">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 1 || loading || currentStep === 2}
              className={currentStep === 2 ? "invisible" : ""}
            >
              Back
            </Button>

            {currentStep < 6 && currentStep !== 2 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !data.syllabus) ||
                  (currentStep === 3 && !data.favoriteSubject) ||
                  (currentStep === 4 && !data.dailyStudyTime) ||
                  (currentStep === 5 && !data.prepLevel)
                }
              >
                {currentStep === 1 ? "Extract Syllabus" : "Continue"}
              </Button>
            ) : null}

            {currentStep === 6 && (
              <Button onClick={handleComplete} loading={loading}>
                {loading ? "Building Routine..." : "Finalize & Go to Dashboard"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
