"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMentorStore } from "@/store/useMentorStore";
import { usePathname, useRouter } from "next/navigation";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Using atomic selectors to prevent unnecessary re-renders
  const init = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const setActiveMentorUser = useMentorStore((s) => s.setActiveUser);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    setActiveMentorUser(user?.uid || null);
  }, [user?.uid, setActiveMentorUser]);

  useEffect(() => {
    if (!initialized) return;

    const isAuthRoute =
      pathname.startsWith("/login") || pathname.startsWith("/signup");
    const isPublicRoute =
      pathname === "/" ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/webhook");
    const isOnboardingRoute = pathname.startsWith("/onboarding");

    if (!user && !isAuthRoute && !isPublicRoute) {
      // Redirect to login if unauthenticated
      router.push("/login");
    } else if (user && isAuthRoute) {
      // If logging in, send to onboarding if not complete, else dashboard
      if (profile && !profile.onboardingComplete) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } else if (
      user &&
      profile &&
      !profile.onboardingComplete &&
      !isOnboardingRoute &&
      !isPublicRoute
    ) {
      // Force user to onboarding if trying to access dashboard
      router.push("/onboarding");
    } else if (
      user &&
      profile &&
      profile.onboardingComplete &&
      isOnboardingRoute
    ) {
      // Don't let users redo onboarding if they already completed it
      router.push("/dashboard");
    }
  }, [user, profile, initialized, pathname, router]);

  // Show loading screen while Firebase auth state is resolving
  if (!initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--surface-0)]">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-4 animate-pulse">
          <span className="text-white font-display font-bold text-base tracking-tighter">
            E
          </span>
        </div>
        <p className="text-[13px] font-semibold text-[var(--text-secondary)]">
          Loading...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
