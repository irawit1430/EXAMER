"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Moon,
  Globe,
  Shield,
  LogOut,
  Save,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { updateUserSettings } from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  // ⚡ Bolt: Use fine-grained selectors to prevent unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const router = useRouter();

  // Initialize from profile
  const [notifications, setNotifications] = useState(true);
  const [whatsappNudges, setWhatsappNudges] = useState(
    profile?.whatsappOptIn ?? true,
  );
  const [darkMode, setDarkMode] = useState(true);
  const [readingDuration, setReadingDuration] = useState(
    String(profile?.readingDuration ?? 150),
  );
  const [displayName, setDisplayName] = useState(
    profile?.displayName || "Student",
  );
  const [targetScore, setTargetScore] = useState(
    String(profile?.targetScore || 250),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "Student");
      setTargetScore(String(profile.targetScore || 250));
      setWhatsappNudges(profile.whatsappOptIn ?? true);
      setReadingDuration(String(profile.readingDuration ?? 150));
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserSettings(user.uid, {
        displayName,
        targetScore: parseInt(targetScore) || 250,
        readingDuration: parseInt(readingDuration) || 150,
        notificationsEnabled: notifications,
        darkMode,
        whatsappOptIn: whatsappNudges,
      });

      // Also update local profile state
      await updateProfile({
        displayName,
        targetScore: parseInt(targetScore) || 250,
        whatsappOptIn: whatsappNudges,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full transition-colors flex items-center px-1
        ${checked ? "bg-success" : "bg-surface-300"}`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md
          ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-8">
      {/* Header */}
      <div className="space-y-1.5 pb-3 border-b border-border-default">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-text-muted">
          Preferences
        </p>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary tracking-tight">
          Settings
        </h1>
      </div>

      {/* Profile */}
      <Card className="p-5 bg-white border border-border-default shadow-sm rounded-2xl">
        <h2 className="text-sm font-bold text-text-primary mb-4 tracking-tight">
          Profile
        </h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-surface-100 flex items-center justify-center text-xl font-bold text-text-secondary border border-border-default">
            {user?.displayName?.charAt(0) || "U"}
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">
              {user?.displayName || "Student"}
            </p>
            <p className="text-[11px] font-medium text-text-secondary">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-default text-[13px] text-text-primary font-medium focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block">
              Target Score
            </label>
            <input
              type="number"
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              min={1}
              max={300}
              className="w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-default text-[13px] text-text-primary font-medium focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
        </div>
      </Card>

      {/* Study Preferences */}
      <Card className="p-5 bg-white border border-border-default shadow-sm rounded-2xl">
        <h2 className="text-sm font-bold text-text-primary mb-4 tracking-tight">
          Study Preferences
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block">
              Reading Duration (seconds before recall)
            </label>
            <input
              type="number"
              value={readingDuration}
              onChange={(e) => setReadingDuration(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-default
                text-[13px] font-medium text-text-primary focus:outline-none focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10 transition-all"
            />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5 bg-white border border-border-default shadow-sm rounded-2xl">
        <h2 className="text-sm font-bold text-text-primary mb-4 tracking-tight">
          Notifications
        </h2>
        <div className="space-y-2">
          {[
            {
              title: "Study Reminders",
              desc: "Get reminded to study",
              default: true,
            },
            {
              title: "Progress Updates",
              desc: "Weekly progress reports",
              default: true,
            },
            {
              title: "Streak Alerts",
              desc: "Don't break your streak",
              default: false,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-border-subtle"
            >
              <div>
                <p className="text-[13px] font-semibold text-text-primary">
                  {item.title}
                </p>
                <p className="text-[11px] font-medium text-text-secondary">
                  {item.desc}
                </p>
              </div>
              <Toggle checked={item.default} onChange={() => {}} />{" "}
              {/* Placeholder onChange */}
            </div>
          ))}
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-5 bg-white border border-border-default shadow-sm rounded-2xl">
        <h2 className="text-sm font-bold text-text-primary mb-4 tracking-tight">
          Appearance
        </h2>
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-border-subtle">
          <div>
            <p className="text-[13px] font-semibold text-text-primary">
              Dark Mode
            </p>
            <p className="text-[11px] font-medium text-text-secondary">
              Switch to dark theme
            </p>
          </div>
          <Toggle checked={darkMode} onChange={setDarkMode} />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          icon={
            saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />
          }
          className="flex-1"
          onClick={handleSave}
          loading={saving}
        >
          {saved ? "Saved!" : "Save Settings"}
        </Button>
        <Button
          variant="danger"
          icon={<LogOut className="w-4 h-4" />}
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
