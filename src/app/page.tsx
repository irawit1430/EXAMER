"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Brain, Cpu, Activity } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function LandingPage() {
  const { user, initialized } = useAuthStore();
  const { scrollY } = useScroll();

  // Subtle parallax effect for the hero image
  const yHero = useTransform(scrollY, [0, 500], [0, 100]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="min-h-screen bg-surface font-sans text-text-primary overflow-x-hidden selection:bg-brand-primary selection:text-white">
      {/* Minimalist Premium Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-3xl border-b border-border-subtle transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-display font-bold text-lg tracking-tighter">
                E
              </span>
            </div>
            <span className="font-display font-semibold text-xl tracking-tight text-text-primary">
              EXAMER
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-text-secondary">
            <Link
              href="#features"
              className="hover:text-text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="#architecture"
              className="hover:text-text-primary transition-colors"
            >
              Architecture
            </Link>
          </nav>
          <div className="flex items-center gap-5">
            {initialized && user ? (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex h-9 items-center justify-center rounded-full bg-brand-primary px-5 text-sm font-medium text-white hover:bg-black transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="hidden sm:inline-flex h-9 items-center justify-center rounded-full bg-text-primary px-5 text-sm font-medium text-white hover:bg-black transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20">
        {/* Hero Section - Cinematic & Bold */}
        <section className="relative px-6 pt-20 md:pt-32 lg:pt-40 pb-16 md:pb-24 flex flex-col items-center text-center overflow-hidden">
          {/* Soft background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-100 border border-border-default text-xs font-semibold text-text-secondary mb-10 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <span>A syllabus-aware study system.</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-[100px] font-bold tracking-tight text-text-primary max-w-5xl mx-auto leading-[0.95]"
          >
            Turn your syllabus into
            <br />
            <span className="text-text-muted">a daily study plan.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 md:mt-12 text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-normal"
          >
            Examer reads your syllabus, tracks your pace, and reshapes each
            session around what still needs work.{" "}
            <br className="hidden md:block" />
            Built for active recall, weak-topic recovery, and exam-day
            consistency.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            {initialized && user ? (
              <Link
                href="/dashboard"
                className="flex h-14 md:h-16 items-center justify-center rounded-full bg-brand-primary px-10 text-lg font-semibold text-white hover:bg-black transition-all hover:shadow-xl hover:shadow-brand-primary/20 hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Enter Workspace
              </Link>
            ) : (
              <Link
                href="/signup"
                className="flex h-14 md:h-16 items-center justify-center rounded-full bg-text-primary px-10 text-lg font-semibold text-white hover:bg-black transition-all hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Build my study plan
              </Link>
            )}
            <Link
              href="#features"
              className="flex h-14 md:h-16 items-center justify-center rounded-full bg-white px-10 text-lg font-medium text-text-primary hover:bg-surface-50 transition-all border border-border-default w-full sm:w-auto group"
            >
              Explore the architecture{" "}
              <ArrowRight className="w-5 h-5 ml-2 text-text-secondary group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Minimalist Hero Asset */}
          <motion.div
            style={{ y: yHero, opacity: opacityHero }}
            className="mt-20 md:mt-24 w-full max-w-6xl mx-auto"
          >
            <div className="aspect-[16/9] md:aspect-[2.4/1] rounded-[3rem] bg-surface-100/50 border border-border-default shadow-sm p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-xl">
              {/* Abstract Tech Representation */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white to-transparent" />
              <div className="flex items-center justify-center gap-12 md:gap-24 text-text-muted z-10 w-full opacity-60">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex flex-col items-center gap-4"
                >
                  <Brain
                    className="w-12 h-12 md:w-20 md:h-20"
                    strokeWidth={1}
                  />
                  <span className="font-display font-medium text-sm tracking-widest uppercase">
                    Cognitive
                  </span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="flex flex-col items-center gap-4"
                >
                  <Cpu
                    className="w-12 h-12 md:w-20 md:h-20 text-brand-primary"
                    strokeWidth={1}
                  />
                  <span className="font-display font-medium text-sm tracking-widest uppercase text-brand-primary">
                    Processing
                  </span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="flex flex-col items-center gap-4"
                >
                  <Activity
                    className="w-12 h-12 md:w-20 md:h-20"
                    strokeWidth={1}
                  />
                  <span className="font-display font-medium text-sm tracking-widest uppercase">
                    Retention
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Refined Features Section - Huge Whitespace */}
        <section
          id="features"
          className="py-20 md:py-28 bg-white border-t border-border-subtle relative z-10"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-16 md:mb-20">
              <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-text-primary leading-[1.1]">
                Built around the way students actually study.
              </h2>
              <p className="mt-8 text-xl md:text-2xl text-text-secondary leading-relaxed font-medium">
                No generic study paths. Examer turns your syllabus, performance,
                and confidence gaps into a routine you can follow every day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Feature 1 */}
              <div className="bg-surface-50 rounded-[2rem] p-12 md:p-16 border border-border-subtle hover:border-border-default transition-colors group">
                <div className="w-16 h-16 rounded-2xl bg-white border border-border-default shadow-sm flex items-center justify-center mb-10 group-hover:scale-105 transition-transform">
                  <Brain className="w-8 h-8 text-black" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-3xl font-bold text-text-primary mb-5 tracking-tight">
                  Syllabus to study loop
                </h3>
                <p className="text-xl text-text-secondary leading-relaxed">
                  Upload your syllabus once. Examer turns it into concepts,
                  checkpoints, and a day-by-day active recall routine.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-surface-50 rounded-[2rem] p-12 md:p-16 border border-border-subtle hover:border-border-default transition-colors group">
                <div className="w-16 h-16 rounded-2xl bg-white border border-border-default shadow-sm flex items-center justify-center mb-10 group-hover:scale-105 transition-transform">
                  <Activity
                    className="w-8 h-8 text-brand-primary"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-display text-3xl font-bold text-text-primary mb-5 tracking-tight">
                  Live performance signals
                </h3>
                <p className="text-xl text-text-secondary leading-relaxed">
                  We track accuracy, response speed, and weak-topic decay so the
                  next session is always obvious.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA - Monolithic */}
        <section className="py-32 md:py-48 bg-surface-100 border-t border-border-subtle">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-text-primary mb-8">
              Ready to study with a system?
            </h2>
            <p className="text-2xl text-text-secondary mb-16 max-w-2xl mx-auto font-medium">
              Set up your syllabus, target score, and daily study time in a few
              minutes.
            </p>
            <Link
              href="/signup"
              className="inline-flex h-16 items-center justify-center rounded-full bg-black px-12 text-xl font-bold text-white hover:bg-gray-900 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
            >
              Create Workspace
            </Link>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-border-subtle py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-6">
          <span className="font-display font-bold text-xl tracking-tight text-text-primary">
            EXAMER
          </span>
          <p className="text-sm font-medium text-text-muted">
            © 2026 Examer. Built for elite exam preparation.
          </p>
        </div>
      </footer>
    </div>
  );
}
