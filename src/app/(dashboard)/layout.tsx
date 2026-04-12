"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/global/Sidebar";
import Navbar from "@/components/global/Navbar";
import GlobalMentor from "@/components/global/GlobalMentor";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Automatically collapse sidebar on smaller desktop screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-surface overflow-hidden text-text-primary">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      <div
        className={`flex-1 flex flex-col h-screen transition-[margin-left] duration-300 relative
          w-full md:ml-[64px] lg:${sidebarCollapsed ? "ml-[64px]" : "ml-[240px]"}
          ${sidebarCollapsed && !mobileMenuOpen ? "ml-0 md:ml-[64px]" : "ml-0"}`}
      >
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 overflow-y-auto relative z-0">
          {children}
        </main>
        
        {/* Floating AI Agent anchored to the viewport so it never scrolls out of view */}
        <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none px-3 sm:px-4 md:px-6 lg:px-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="w-full max-w-[1440px] mx-auto flex justify-end">
            <div className="pointer-events-auto">
              <GlobalMentor />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
