"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { auth, db } from "@/lib/firebase/config";
import Button from "@/components/ui/Button";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    targetScore: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );

      // 2. Update Auth display name
      await updateProfile(userCredential.user, { displayName: form.name });

      // 3. Create Firestore User Document
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: form.name,
        email: form.email,
        targetScore: parseInt(form.targetScore) || 250,
        examDate: new Date(),
        predictedScore: 0,
        streak: { current: 0, longest: 0, lastActive: new Date() },
        whatsappOptIn: false,
        createdAt: new Date(),
        onboardingComplete: false,
      });

      // Redirect to onboarding step 1 instead of dashboard
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to create an account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);

      // We can optionally check if they are new, but keeping it simple:
      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          uid: userCredential.user.uid,
          displayName: userCredential.user.displayName || "Student",
          email: userCredential.user.email || "",
          targetScore: 250,
          examDate: new Date(),
          predictedScore: 0,
          streak: { current: 0, longest: 0, lastActive: new Date() },
          whatsappOptIn: false,
          createdAt: new Date(),
          onboardingComplete: false,
        },
        { merge: true },
      );

      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="flex flex-col items-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-4">
          <span className="text-white font-display font-bold text-base tracking-tighter">
            E
          </span>
        </div>
        <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
          Get started.
        </h1>
        <p className="text-[13px] font-medium text-text-secondary mt-1">
          Create your account to begin.
        </p>
      </div>

      <div className="glass-card p-6 space-y-4">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-default
                    text-[13px] text-text-primary font-medium placeholder:text-text-muted
                    focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10 transition-all"
                required
              />
            </div>

            {/* Target Score */}
            <div>
              <label
                htmlFor="targetScore"
                className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block"
              >
                Target Score
              </label>
              <input
                id="targetScore"
                type="number"
                value={form.targetScore}
                onChange={(e) => updateField("targetScore", e.target.value)}
                placeholder="Max 300"
                min={1}
                max={300}
                className="w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-default
                    text-[13px] text-text-primary font-medium placeholder:text-text-muted
                    focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10 transition-all"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-default
                  text-[13px] text-text-primary font-medium placeholder:text-text-muted
                  focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10 transition-all"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-default
                    text-[13px] text-text-primary font-medium placeholder:text-text-muted
                    focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10 transition-all"
                required
                minLength={8}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
              size="md"
            >
              Create Account
            </Button>
          </div>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-border-default" />
          <span className="flex-shrink-0 px-3 text-[11px] font-semibold text-text-muted">
            or continue with
          </span>
          <div className="flex-grow border-t border-border-default" />
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white
            border border-border-default text-[13px] font-semibold text-text-primary
            hover:bg-surface-50 transition-all disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>
      </div>

      <p className="text-center text-[13px] font-medium text-text-secondary mt-5">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-brand-primary font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
