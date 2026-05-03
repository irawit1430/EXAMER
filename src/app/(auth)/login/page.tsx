"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import { auth } from "@/lib/firebase/config";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Let AuthProvider handle the redirect (it checks onboardingComplete)
      setLoginSuccess(true);
    } catch (err: any) {
      setError(
        err.message || "Failed to login. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Let AuthProvider handle the redirect (it checks onboardingComplete)
      setLoginSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to login with Google.");
    } finally {
      setLoading(false);
    }
  };

  if (loginSuccess) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-4 animate-pulse">
          <span className="text-white font-display font-bold text-base tracking-tighter">
            E
          </span>
        </div>
        <p className="text-[13px] font-semibold text-text-secondary">
          Signing you in...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-4">
          <span className="text-white font-display font-bold text-base tracking-tighter">
            E
          </span>
        </div>
        <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
          Welcome back.
        </h1>
        <p className="text-[13px] font-medium text-text-secondary mt-1">
          Continue your mastery journey.
        </p>
      </div>

      {/* Login Card */}
      <div className="glass-card p-6 space-y-4">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block">
              Email address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-default
                  text-[13px] text-text-primary font-medium placeholder:text-text-muted
                  focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10
                  transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Password
              </label>
              <button
                type="button"
                className="text-[11px] font-semibold text-text-secondary hover:text-brand-primary transition-colors"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-default
                    text-[13px] text-text-primary font-medium placeholder:text-text-muted
                    focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10
                    transition-all"
                required
                minLength={6}
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

          {/* Login button */}
          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="md"
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-border-default" />
          <span className="flex-shrink-0 px-3 text-[11px] font-semibold text-text-muted">
            or continue with
          </span>
          <div className="flex-grow border-t border-border-default" />
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
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

      {/* Sign up link */}
      <p className="text-center text-[13px] font-medium text-text-secondary mt-5">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-brand-primary font-semibold hover:underline"
        >
          Create account
        </Link>
      </p>
    </motion.div>
  );
}
