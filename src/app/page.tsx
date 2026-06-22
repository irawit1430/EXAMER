"use client";

import React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";

export default function LandingPage() {
  // ⚡ Bolt: Use fine-grained selectors to prevent unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const { scrollYProgress, scrollY } = useScroll();

  // 3D Card Hover Effect State
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 150, damping: 20 });
  const glareX = useTransform(mouseX, [0, 1], [0, 100]);
  const glareY = useTransform(mouseY, [0, 1], [0, 100]);
  const backgroundGlare = useMotionTemplate`radial-gradient(800px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.7), transparent 30%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  // Parallax transforms for Hero Section (mapped directly to scroll pixels for immediate, obvious effect)
  const ghostTextY = useTransform(scrollY, [0, 1000], [0, 400]); // Moves down significantly (slower scroll)
  const heroTextY = useTransform(scrollY, [0, 800], [0, -100]); // Moves up slightly faster
  const heroUiY = useTransform(scrollY, [0, 800], [0, -250]); // Moves up much faster (extreme parallax)
  
  // Parallax transforms for Philosophy section SVG
  const philosophyPathProgress = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);

  return (
    <div className="min-h-screen bg-surface font-sans text-text-primary selection:bg-brand-primary selection:text-white">
      {/* Minimalist Premium Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <span className="text-white font-display font-bold text-lg tracking-tighter">E</span>
            </div>
            <span className="font-display font-semibold text-xl tracking-tight text-text-primary">
              EXAMER
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <Link href="#philosophy" className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded">
              Philosophy
            </Link>
            <Link href="#methodology" className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded">
              Methodology
            </Link>
            <Link href="#metrics" className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded">
              Metrics
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {initialized && user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-sm font-medium text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded px-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-text-primary px-4 text-sm font-medium text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16 overflow-hidden">
        {/* HERO SECTION */}
        <section className="px-6 pt-24 pb-20 md:pt-32 md:pb-32 max-w-7xl mx-auto relative min-h-[calc(100vh-4rem)] flex flex-col justify-center">

          {/* Architectural engineering grid background - grounds the parallax effect */}
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-80 pointer-events-none" aria-hidden="true" />
          
          {/* Layered Cinematic Title effect: huge ghost text pushed to section background */}
          <motion.div style={{ y: ghostTextY }} className="absolute top-[15%] left-1/2 -translate-x-1/2 text-[100px] sm:text-[140px] md:text-[200px] lg:text-[260px] font-display font-black text-text-primary/[0.03] select-none pointer-events-none tracking-tighter whitespace-nowrap -z-10 flex" aria-hidden="true">
            RETAIN
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              style={{ y: heroTextY }}
              className="flex flex-col items-start relative z-10"
            >

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-50 border border-border-default/60 shadow-sm text-xs font-semibold text-text-secondary mb-8 hover:bg-surface-100 transition-colors cursor-default"
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-brand-primary" />
                Waitlist Open
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.05] mb-6 relative text-balance"
              >
                Stop reading. Start retaining.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg md:text-xl text-text-secondary leading-relaxed mb-10 max-w-lg relative"
              >
                Examer parses your syllabus, tests your knowledge using the Feynman technique, and algorithmically builds your daily study routine to guarantee retention before exam day.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full relative"
              >
                {initialized && user ? (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                    <Link
                      href="/dashboard"
                      className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-brand-primary px-8 text-base font-bold text-white transition-shadow hover:shadow-xl hover:shadow-brand-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                    >
                      Open Workspace
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                    <Link
                      href="/signup"
                      className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-text-primary px-8 text-base font-bold text-white transition-shadow hover:shadow-xl hover:shadow-text-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                    >
                      Build your study plan
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Hero Interactive UI Representation with structural entrance & 3D Parallax Tilt */}
            <div className="relative mt-8 lg:mt-0 z-20 group" style={{ perspective: 1200 }}>
              <motion.div
                style={{ y: heroUiY, rotateX, rotateY }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full aspect-[4/3] sm:aspect-square lg:aspect-square bg-surface-50 border border-border-default rounded-2xl shadow-2xl shadow-text-primary/5 p-4 sm:p-6 flex flex-col gap-4 overflow-hidden transform-gpu will-change-transform ease-out"
                aria-hidden="true"
              >
                {/* Dynamic Mouse Tracking Glare overlay */}
                <motion.div 
                  className="absolute inset-0 z-50 pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: backgroundGlare, mixBlendMode: 'soft-light' }}
                />

                {/* Subtle ambient glow to lift it off the background */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-[60px] pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface-50 to-transparent z-10 pointer-events-none" />
              
              <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <div className="w-3 h-3 rounded-full bg-warning" />
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-sm font-semibold text-text-muted mt-2"
              >
                ACTIVE RECALL SESSION
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="text-xl font-bold text-text-primary mb-2"
              >
                Explain the function of Mitochondria.
              </motion.div>
              
              {/* Synthetic Text Area */}
              <div className="flex-1 bg-white border border-border-subtle rounded-xl p-4 shadow-inner relative z-0 flex flex-col gap-3 transition-colors group-hover:border-border-active">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 1.1, duration: 0.5, ease: "easeOut" }} className="h-4 bg-surface-100 rounded" />
                <motion.div initial={{ width: 0 }} animate={{ width: "91.666%" }} transition={{ delay: 1.2, duration: 0.5, ease: "easeOut" }} className="h-4 bg-surface-100 rounded" />
                <motion.div initial={{ width: 0 }} animate={{ width: "80%" }} transition={{ delay: 1.3, duration: 0.5, ease: "easeOut" }} className="h-4 bg-surface-100 rounded" />
                
                {/* Synthetic Grading Popover Pop In */}
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 2, type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute bottom-4 right-4 bg-text-primary text-white p-3 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-md border border-surface-400"
                >
                  <div className="flex-1">
                    <div className="text-xs font-bold font-display uppercase">Accuracy</div>
                    <div className="w-24 h-1.5 bg-surface-400 rounded-full mt-1 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ delay: 2.3, duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-success rounded-full" 
                      />
                    </div>
                  </div>
                  <div className="text-xl font-bold">85%</div>
                </motion.div>
              </div>
            </motion.div>
            </div>
          </div>
        </section>

        {/* PHILOSOPHY SECTION */}
        <section id="philosophy" className="py-24 bg-text-primary text-white border-y border-border-subtle relative overflow-hidden">
          {/* Subtle moving background mesh for depth */}
          <div className="absolute inset-0 bg-neutral-900 overflow-hidden z-0">
             <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20"
                style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 60%)' }}
             />
          </div>
          
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-8 drop-shadow-sm">
                The illusion of competence.
              </h2>
              <div className="space-y-6 text-xl text-surface-300 leading-relaxed">
                <p>
                  Reading a textbook feels productive. Highlighting notes feels like learning. But cognitive science proves these are passive activities. They create fluency, not retention.
                </p>
                <p>
                  Examer is built on a single premise: <strong className="text-white drop-shadow-md">You only know it if you can explain it.</strong>
                </p>
                <p>
                  By forcing you to type out explanations and grading them instantly via AI, we destroy the illusion of competence and force genuine neural connections.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="relative aspect-square rounded-2xl bg-black border border-surface-400 p-8 flex flex-col items-center justify-center gap-8 shadow-2xl"
            >
              {/* Custom abstract chart showing reading vs active recall */}
              <svg viewBox="0 0 400 300" className="w-full h-auto stroke-surface-300 relative z-10" fill="none" strokeWidth="2">
                {/* Axes */}
                <path d="M40 260 L360 260" />
                <path d="M40 260 L40 40" />
                
                {/* Passive Reading Line (Flattens out) */}
                <motion.path 
                  d="M40 260 Q 150 200 360 180" 
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <motion.text 
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1 }} viewport={{ once:true }}
                  x="370" y="185" className="fill-surface-300 text-xs font-sans drop-shadow-sm" stroke="none"
                >Reading</motion.text>
                
                {/* Active Recall Line (Compounds) with glowing effect */}
                <motion.path 
                  d="M40 260 C 150 250 200 150 360 60" 
                  stroke="#fff" 
                  strokeWidth="4" 
                  style={{ pathLength: philosophyPathProgress }}
                />
                {/* Glow layer */}
                <motion.path 
                  d="M40 260 C 150 250 200 150 360 60" 
                  stroke="rgba(255,255,255,0.3)" 
                  strokeWidth="10" 
                  style={{ pathLength: philosophyPathProgress }}
                />
                
                <motion.text 
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1 }} viewport={{ once:true }}
                  x="370" y="65" className="fill-white text-xs font-bold font-sans drop-shadow-md" stroke="none"
                >Examer</motion.text>
                
                <text x="180" y="280" className="fill-surface-300 text-sm font-sans tracking-wide" stroke="none">Time Spent</text>
                <text x="20" y="150" transform="rotate(-90 20 150)" className="fill-surface-300 text-sm font-sans text-center tracking-wide" stroke="none">Retention</text>
              </svg>
            </motion.div>
          </div>
        </section>

        {/* deep METHODOLOGY SECTION */}
        <section id="methodology" className="py-24 md:py-32 bg-surface-50 relative">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white to-transparent pointer-events-none z-0" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
               className="max-w-3xl mb-24"
            >
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-6">
                How Examer constructs your brain.
              </h2>
              <p className="text-xl text-text-secondary leading-relaxed">
                A three-step architecture designed to consume raw material and output permanent memory.
              </p>
            </motion.div>

            <div className="space-y-32">
              {/* Feature 1: Parser */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="order-2 md:order-1 bg-white border border-border-default rounded-2xl p-8 aspect-square md:aspect-auto h-[400px] flex items-center justify-center shadow-lg shadow-border-default/20 hover:border-brand-primary/30 transition-colors"
                >
                  {/* Syllabus Tree SVG */}
                  <svg viewBox="0 0 300 300" className="w-full h-full" fill="none">
                    {/* Source Doc */}
                    <rect x="120" y="20" width="60" height="80" rx="4" className="fill-surface-100 stroke-border-default" strokeWidth="2" />
                    <line x1="130" y1="40" x2="170" y2="40" className="stroke-border-default" strokeWidth="2" />
                    <line x1="130" y1="55" x2="170" y2="55" className="stroke-border-default" strokeWidth="2" />
                    
                    {/* Connections drawn dynamically */}
                    <motion.path d="M150 100 L150 140" className="stroke-brand-primary/40" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 0.2, duration: 0.5 }} />
                    <motion.path d="M150 140 L70 180" className="stroke-brand-primary/40" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 0.6, duration: 0.5 }} />
                    <motion.path d="M150 140 L230 180" className="stroke-brand-primary/40" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 0.6, duration: 0.5 }} />
                    
                    {/* Nodes popping in */}
                    <motion.circle cx="150" cy="140" r="6" className="fill-brand-primary" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 0.5, type: 'spring' }} />
                    <motion.circle cx="70" cy="180" r="30" className="fill-white stroke-brand-primary" strokeWidth="2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 1, type: 'spring' }} />
                    <motion.circle cx="230" cy="180" r="30" className="fill-white stroke-brand-primary" strokeWidth="2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 1, type: 'spring' }} />
                    
                    {/* Sub-nodes */}
                    <motion.path d="M70 210 L50 250" className="stroke-brand-primary/40" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 1.4, duration: 0.5 }} />
                    <motion.path d="M70 210 L90 250" className="stroke-brand-primary/40" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 1.4, duration: 0.5 }} />
                    <motion.circle cx="50" cy="250" r="15" className="fill-surface-100 stroke-border-default" strokeWidth="2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 1.8, type: 'spring' }} />
                    <motion.circle cx="90" cy="250" r="15" className="fill-brand-primary/20 stroke-brand-primary" strokeWidth="2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 1.8, type: 'spring' }} />
                    
                    <motion.path d="M230 210 L230 250" className="stroke-brand-primary/40" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 1.4, duration: 0.5 }} />
                    <motion.circle cx="230" cy="250" r="15" className="fill-success/20 stroke-success" strokeWidth="2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 1.8, type: 'spring' }} />
                  </svg>
                </motion.div>
                <div className="order-1 md:order-2">
                  <div className="text-brand-primary font-bold text-sm tracking-widest uppercase mb-4 shadow-sm">Phase 01</div>
                  <h3 className="font-display text-3xl font-bold text-text-primary mb-6">Taxonomy Extraction</h3>
                  <p className="text-lg text-text-secondary leading-relaxed">
                    Dump your PDF syllabus, lecture notes, or course outlines into Examer. Our LLM-powered parser tears the document apart, identifying core concepts, sub-topics, and dependencies, rendering them into an interconnected knowledge tree.
                  </p>
                </div>
              </div>

              {/* Feature 2: Recall */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="text-brand-primary font-bold text-sm tracking-widest uppercase mb-4 shadow-sm">Phase 02</div>
                  <h3 className="font-display text-3xl font-bold text-text-primary mb-6">The Feynman Engine</h3>
                  <p className="text-lg text-text-secondary leading-relaxed">
                    We don't ask multiple-choice questions. Examer presents a concept from your syllabus and forces you to explain it in plain text. The engine evaluates your response against the ground truth, identifying missing facts, logical errors, or fuzzy reasoning.
                  </p>
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="bg-white border border-border-default rounded-2xl p-8 aspect-square md:aspect-auto h-[400px] flex items-center justify-center shadow-lg shadow-border-default/20 relative overflow-hidden hover:border-brand-primary/30 transition-colors"
                >
                   {/* Feynman Interaction SVG */}
                   <svg viewBox="0 0 400 300" className="w-full h-full" fill="none">
                    {/* Prompt Box */}
                    <rect x="40" y="40" width="320" height="60" rx="8" className="fill-surface-100 stroke-border-default" strokeWidth="1" />
                    <text x="60" y="75" className="fill-text-primary font-bold font-sans text-sm" stroke="none">Explain: Action Potentials</text>
                    
                    {/* Input Box */}
                    <rect x="40" y="120" width="320" height="100" rx="8" className="fill-white stroke-border-active" strokeWidth="2" />
                    <motion.path d="M60 150 L280 150" className="stroke-text-secondary" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 0.3, duration: 1 }} />
                    <motion.path d="M60 170 L340 170" className="stroke-text-secondary" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 1.3, duration: 1 }} />
                    <motion.path d="M60 190 L180 190" className="stroke-text-secondary" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 2.3, duration: 0.5 }} />
                    
                    {/* Caret Blinking */}
                    <motion.line 
                      x1="190" y1="180" x2="190" y2="200" className="stroke-brand-primary" strokeWidth="2"
                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    
                    {/* Floating Feedback Node Pop In */}
                    <motion.g 
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 3, type: "spring" }}
                      transform="translate(180, 100)"
                    >
                      <rect x="0" y="0" width="160" height="50" rx="6" className="fill-text-primary" />
                      <circle cx="20" cy="25" r="5" className="fill-warning" />
                      <text x="35" y="29" className="fill-white font-bold font-sans justify-center text-[10px]" stroke="none">Missing: Depolarization</text>
                    </motion.g>
                  </svg>
                </motion.div>
              </div>

              {/* Feature 3: Spaced Repetition */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="order-2 md:order-1 bg-white border border-border-default rounded-2xl p-8 aspect-square md:aspect-auto h-[400px] flex items-center justify-center shadow-lg shadow-border-default/20 hover:border-brand-primary/30 transition-colors"
                >
                  {/* Spaced Repetition SVG */}
                  <svg viewBox="0 0 400 300" className="w-full h-full" fill="none">
                    {/* Grid */}
                    <path d="M40 250 L360 250" className="stroke-border-default" strokeWidth="1" />
                    <path d="M40 250 L40 50" className="stroke-border-default" strokeWidth="1" />
                    
                    {/* 100% threshold line */}
                    <path d="M40 80 L360 80" className="stroke-border-subtle" strokeDasharray="4,4" strokeWidth="1" />
                    
                    {/* Decay Curve 1 */}
                    <motion.path d="M60 80 C 100 180 120 220 120 220" className="stroke-text-secondary" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ duration: 1 }} />
                    <motion.circle cx="120" cy="220" r="4" className="fill-surface-0 stroke-text-secondary" strokeWidth="2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 1 }} />
                    
                    {/* Review 1 jumps up, then Decay Curve 2 */}
                    <motion.line x1="120" y1="220" x2="120" y2="80" className="stroke-border-default" strokeDasharray="2,2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 1.2, duration: 0.3 }} />
                    <motion.path d="M120 80 C 180 150 210 180 210 180" className="stroke-brand-primary" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 1.5, duration: 1 }} />
                    <motion.circle cx="210" cy="180" r="4" className="fill-surface-0 stroke-brand-primary" strokeWidth="2" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 2.5 }} />

                    {/* Review 2 jumps up, then Decay Curve 3 (flatter) */}
                    <motion.line x1="210" y1="180" x2="210" y2="80" className="stroke-border-default" strokeDasharray="2,2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 2.7, duration: 0.3 }} />
                    <motion.path d="M210 80 C 280 110 340 120 340 120" className="stroke-success" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ delay: 3, duration: 1 }} />
                    <motion.circle cx="340" cy="120" r="4" className="fill-success" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 4 }} />

                    {/* Target nodes appearing simultaneously */}
                    <motion.circle cx="60" cy="80" r="5" className="fill-text-primary" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ type: 'spring' }} />
                    <motion.circle cx="120" cy="80" r="5" className="fill-brand-primary" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 1.5, type: 'spring' }} />
                    <motion.circle cx="210" cy="80" r="5" className="fill-success" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once:true }} transition={{ delay: 3, type: 'spring' }} />
                  </svg>
                </motion.div>
                <div className="order-1 md:order-2">
                  <div className="text-brand-primary font-bold text-sm tracking-widest uppercase mb-4 shadow-sm">Phase 03</div>
                  <h3 className="font-display text-3xl font-bold text-text-primary mb-6">Algorithmic Scheduling</h3>
                  <p className="text-lg text-text-secondary leading-relaxed">
                    Based on Hermann Ebbinghaus's forgetting curve, Examer schedules your reviews just as you are about to forget them. A poor explanation schedules a review for tomorrow. A perfect explanation pushes it out for a week. You literally cannot over-study or under-study.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID / MICRO FEATURES */}
        <section id="metrics" className="py-24 md:py-32 bg-white border-t border-border-subtle">
          <div className="max-w-7xl mx-auto px-6">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-16 text-center"
            >
              The data behind your degree.
            </motion.h2>

            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true }}
              variants={{
                 hidden: { opacity: 0 },
                 visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]"
            >
              {/* Box 1: Kinetic Score */}
              <motion.div 
                 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } } }}
                 className="md:col-span-2 bg-surface-50 border border-border-default rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-full flex-1 mb-6 flex items-end gap-2 pb-4 border-b border-border-subtle relative">
                  {/* Abstract Bar Chart growing up */}
                  <motion.div initial={{ height: 0 }} whileInView={{ height: "30%" }} viewport={{ once:true }} className="w-[10%] bg-surface-200 rounded-t-sm" />
                  <motion.div initial={{ height: 0 }} whileInView={{ height: "20%" }} viewport={{ once:true }} className="w-[10%] bg-surface-200 rounded-t-sm" />
                  <motion.div initial={{ height: 0 }} whileInView={{ height: "45%" }} viewport={{ once:true }} className="w-[10%] bg-surface-300 rounded-t-sm" />
                  <motion.div initial={{ height: 0 }} whileInView={{ height: "40%" }} viewport={{ once:true }} className="w-[10%] bg-surface-300 rounded-t-sm" />
                  <motion.div initial={{ height: 0 }} whileInView={{ height: "65%" }} viewport={{ once:true }} className="w-[10%] bg-brand-primary/40 rounded-t-sm transition-colors group-hover:bg-brand-primary/50" />
                  <motion.div initial={{ height: 0 }} whileInView={{ height: "60%" }} viewport={{ once:true }} className="w-[10%] bg-brand-primary/60 rounded-t-sm transition-colors group-hover:bg-brand-primary/70" />
                  <motion.div initial={{ height: 0 }} whileInView={{ height: "85%" }} viewport={{ once:true }} className="w-[10%] bg-brand-primary/80 rounded-t-sm transition-colors group-hover:bg-brand-primary" />
                  <motion.div initial={{ height: 0 }} whileInView={{ height: "95%" }} viewport={{ once:true }} className="w-[10%] bg-brand-primary relative rounded-t-sm shadow-lg shadow-brand-primary/20">
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-bold text-sm bg-text-primary text-white px-2 py-0.5 rounded shadow-sm">95%</span>
                  </motion.div>
                  {/* Trend line */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <motion.path 
                       d="M 5% 70% Q 25% 60% 35% 55% T 65% 40% T 95% 5%" 
                       className="stroke-success" strokeWidth="2.5" fill="none" strokeDasharray="4,4" 
                       initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once:true }} transition={{ duration: 1.5, delay: 0.5 }}
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-text-primary mb-2">Kinetic Score Tracking</h3>
                  <p className="text-text-secondary">Watch your readiness physically compound over the semester.</p>
                </div>
              </motion.div>

              {/* Box 2: Speed / Latency */}
              <motion.div 
                 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } } }}
                 className="bg-surface-50 border border-border-default rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-32 h-32 rounded-full border-4 border-surface-200 flex items-center justify-center shadow-inner">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <motion.circle 
                         cx="64" cy="64" r="60" className="stroke-brand-primary" strokeWidth="4" fill="none" strokeDasharray="377" strokeLinecap="round" 
                         initial={{ strokeDashoffset: 377 }} whileInView={{ strokeDashoffset: 120 }} viewport={{ once:true }} transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <span className="font-display text-3xl font-bold drop-shadow-sm">12s</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-text-primary mb-2">Recall Velocity</h3>
                  <p className="text-text-secondary text-sm">Measure cognitive friction. Faster typing means deeper encoding.</p>
                </div>
              </motion.div>

              {/* Box 3: Heatmap */}
              <motion.div 
                 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } } }}
                 className="bg-surface-50 border border-border-default rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex-1 overflow-hidden grid grid-cols-7 grid-rows-4 gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  {[...Array(28)].map((_, i) => (
                    <motion.div 
                       key={i} 
                       initial={{ opacity: 0, scale: 0.5 }} 
                       whileInView={{ opacity: 1, scale: 1 }} 
                       viewport={{ once: true }} 
                       transition={{ delay: i * 0.02 }}
                       className={`rounded-sm shadow-sm ${Math.random() > 0.5 ? 'bg-brand-primary/20' : Math.random() > 0.8 ? 'bg-brand-primary/60' : Math.random() > 0.9 ? 'bg-brand-primary' : 'bg-surface-200'}`} 
                    />
                  ))}
                </div>
                <div className="mt-4">
                  <h3 className="font-display text-xl font-bold text-text-primary mb-2">Consistency Grid</h3>
                  <p className="text-text-secondary text-sm">Build the daily habit of active recall.</p>
                </div>
              </motion.div>

              {/* Box 4: Dark Mode / UI */}
              <motion.div 
                 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } } }}
                 className="md:col-span-2 bg-text-primary border border-border-default rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative shadow-lg"
              >
                {/* Abstract light beam sweeping */}
                <motion.div 
                  animate={{ x: ["-100%", "200%"] }} 
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 z-0" 
                />
                
                <div className="flex-1 mb-6 border border-surface-400 rounded-xl bg-black p-4 flex flex-col gap-3 opacity-90 overflow-hidden relative z-10 shadow-2xl">
                  <div className="absolute top-0 right-10 w-32 h-32 bg-brand-primary/20 blur-3xl" />
                  <div className="w-1/3 h-3 rounded bg-surface-400" />
                  <div className="w-1/2 h-3 rounded bg-surface-300" />
                  <div className="w-full h-12 rounded-lg border border-surface-400 bg-surface-400/20 mt-2 backdrop-blur-sm" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-display text-xl font-bold text-white mb-2 drop-shadow-sm">Premium Study Environment</h3>
                  <p className="text-surface-300">Distraction-free interface designed specifically for long study sessions, complete with dark mode.</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-surface-100 border-t border-border-subtle relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-6">
              Engineering your academic success.
            </h2>
            <p className="text-lg text-text-secondary mb-10">
              Join the students who have replaced hope with data. Setup takes 5 minutes.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="inline-flex h-14 items-center justify-center rounded-xl bg-text-primary px-10 text-base font-bold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 shadow-xl shadow-text-primary/20"
              >
                Initialize Workspace
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-border-subtle py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-tight text-text-primary">
              EXAMER
            </span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-text-secondary">
            <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
            <a href="mailto:support@examer.io" className="hover:text-text-primary transition-colors">Support</a>
          </div>
          <p className="text-sm font-medium text-text-muted">
            &copy; {new Date().getFullYear()} Examer System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
