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

  return (
    <div className="flex h-screen bg-surface overflow-hidden text-text-primary">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />
      <div
        className={`flex-1 flex flex-col h-screen transition-[margin-left] duration-300 relative ${
          sidebarCollapsed ? "ml-[64px]" : "ml-[240px]"
        }`}
      >
        <Navbar />
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 overflow-y-auto relative z-0">
          {children}
        </main>
        
        {/* Floating AI Agent perfectly aligned symmetrically to the 1440px main container grid */}
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-end px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8">
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
