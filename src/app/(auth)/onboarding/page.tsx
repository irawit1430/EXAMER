"use client";

import React from "react";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-surface font-sans text-text-primary overflow-x-hidden selection:bg-brand-primary selection:text-white">
      <OnboardingFlow />
    </div>
  );
}
