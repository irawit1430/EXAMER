"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Brain,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/mocks", label: "Mock Tests", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-200 ease-out
        ${collapsed ? "w-[64px]" : "w-[240px]"}
        bg-white border-r border-border-default`}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-2.5 py-4 border-b border-border-default transition-all ${collapsed ? "px-3 justify-center" : "px-5"}`}
      >
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
          <span className="text-white font-display font-bold text-sm tracking-tighter">
            E
          </span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-display font-bold text-base text-text-primary leading-none tracking-tight">
              EXAMER
            </h1>
            <p className="text-[9px] text-text-muted tracking-widest uppercase mt-0.5 font-medium">
              Intelligence
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
                transition-all duration-150 group relative
                ${
                  isActive
                    ? "bg-surface-100 text-text-primary font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-50"
                } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                  isActive
                    ? "text-text-primary"
                    : "text-text-muted group-hover:text-text-secondary"
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Streak Badge */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-surface-50 border border-border-subtle">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Streak
            </span>
          </div>
          <p className="text-xl font-display font-bold text-text-primary tracking-tight">
            5{" "}
            <span className="text-xs font-semibold text-text-muted">days</span>
          </p>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        type="button"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggle}
        className="flex items-center justify-center py-3 border-t border-border-default
          text-text-muted hover:text-text-primary hover:bg-surface-50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
