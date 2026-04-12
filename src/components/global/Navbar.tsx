"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bell, Search, Flame, User, Menu } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

type NavbarProps = {
  onOpenMobileMenu?: () => void;
};

export default function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const profile = useAuthStore((s) => s.profile);
  const [searchShortcut, setSearchShortcut] = useState("Ctrl+K");

  // Calculate days until exam dynamically
  const daysUntilExam = useMemo(() => {
    const d = profile?.examDate;
    if (!d) return "—";
    let examDate: Date | null = null;
    if (d instanceof Date) examDate = d;
    else if (typeof (d as any)?.toDate === "function")
      examDate = (d as any).toDate();
    else if (typeof (d as any)?.seconds === "number")
      examDate = new Date((d as any).seconds * 1000);
    else {
      const parsed = new Date(d as any);
      examDate = isNaN(parsed.getTime()) ? null : parsed;
    }
    if (!examDate) return "—";
    return Math.max(
      0,
      Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
  }, [profile?.examDate]);

  // Calculate streak
  const currentStreak = useMemo(() => {
    const streak = profile?.streak;
    if (!streak?.current || !streak?.lastActive) return 0;
    const lastActive =
      streak.lastActive instanceof Date
        ? streak.lastActive
        : (streak.lastActive as any)?.toDate?.() ||
          new Date(streak.lastActive as any);
    const now = new Date();
    const lastDay = new Date(
      lastActive.getFullYear(),
      lastActive.getMonth(),
      lastActive.getDate(),
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysDiff = Math.floor(
      (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysDiff <= 1 ? streak.current : 0;
  }, [profile?.streak]);

  const displayName = profile?.displayName?.split(" ")[0] || "Student";

  useEffect(() => {
    const isAppleDevice = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
    setSearchShortcut(isAppleDevice ? "⌘K" : "Ctrl+K");
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-2 px-4 sm:px-6 border-b border-border-default bg-white/90 backdrop-blur-xl transition-all duration-200">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onOpenMobileMenu}
        className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-50"
      >
        <Menu className="w-4 h-4" />
      </button>
      {/* Search */}
      <div className="hidden sm:flex items-center gap-3 flex-1 max-w-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted transition-colors group-focus-within:text-brand-primary" />
          <input
            type="text"
            placeholder="Search concepts, topics..."
            aria-label="Search concepts and topics"
            className="w-full pl-9 pr-12 py-1.5 rounded-lg bg-surface-50 border border-border-default
              text-[13px] text-text-primary placeholder:text-text-muted font-medium
              focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10 focus:bg-white
              transition-all duration-200"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-text-muted bg-surface-100 px-1.5 py-0.5 rounded border border-border-subtle font-semibold tracking-wider">
            {searchShortcut}
          </kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Streak */}
        <div className="hidden md:flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg bg-surface-50 border border-border-subtle hover:bg-surface-100 transition-all cursor-pointer">
          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />
          <span className="text-[13px] font-bold text-orange-500">
            Day {currentStreak}
          </span>
        </div>

        {/* Days to exam */}
        <div className="hidden md:flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-50 border border-border-subtle hover:bg-surface-100 transition-colors">
          <span className="text-[13px] text-text-secondary font-medium">
            <span className="text-text-primary font-semibold">
              {daysUntilExam}
            </span>{" "}
            days left
          </span>
        </div>

        {/* Notifications */}
        <button aria-label="Notifications" className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-100 transition-colors group border border-transparent hover:border-border-subtle">
          <Bell className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
        </button>

        {/* Profile */}
        <Link
          href="/settings"
          className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-lg hover:bg-surface-50 border border-transparent hover:border-border-subtle transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center border border-border-default overflow-hidden">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-text-primary hidden sm:block">
            {displayName}
          </span>
        </Link>
      </div>
    </header>
  );
}
