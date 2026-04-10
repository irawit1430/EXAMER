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
    <div className="flex min-h-screen bg-surface text-text-primary">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin-left] duration-200 ${
          sidebarCollapsed ? "ml-[64px]" : "ml-[240px]"
        }`}
      >
        <Navbar />
        <main className="flex-1 p-5 overflow-y-auto">{children}</main>
      </div>
      <GlobalMentor />
    </div>
  );
}
