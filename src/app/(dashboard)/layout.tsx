"use client";

import React, { useState } from "react";
import Sidebar from "@/components/global/Sidebar";
import Navbar from "@/components/global/Navbar";
import GlobalMentor from "@/components/global/GlobalMentor";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-surface text-text-primary">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />
      <div
        className={`flex min-h-[100dvh] min-w-0 flex-1 flex-col transition-[margin-left] duration-300 relative ${
          sidebarCollapsed ? "lg:ml-[64px]" : "lg:ml-[240px]"
        }`}
      >
        <Navbar onOpenMobileMenu={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 min-w-0 w-full app-container py-6 md:py-8 relative z-0">
          {children}
        </main>
        
        {/* Floating AI Agent anchored to the viewport so it never scrolls out of view */}
        <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none px-3 sm:px-4 md:px-6 lg:px-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="w-full max-w-[1200px] mx-auto flex justify-end">
            <div className="pointer-events-auto">
              <GlobalMentor />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
