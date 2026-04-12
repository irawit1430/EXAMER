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
  X,
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
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
};

export default function Sidebar({ collapsed, onToggle, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen !== undefined && (
        <div
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden
            ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setMobileOpen?.(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${collapsed && !mobileOpen ? "w-[64px]" : "w-[240px]"}
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
          bg-white border-r border-border-default`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-2.5 py-4 border-b border-border-default transition-all relative ${
            collapsed && !mobileOpen ? "px-3 justify-center" : "px-5"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-black flex flex-shrink-0 items-center justify-center">
            <span className="text-white font-display font-bold text-sm tracking-tighter">
              E
            </span>
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="overflow-hidden flex-1">
              <h1 className="font-display font-bold text-base text-text-primary leading-none tracking-tight">
                EXAMER
              </h1>
              <p className="text-[9px] text-text-muted tracking-widest uppercase mt-0.5 font-medium">
                Intelligence
              </p>
            </div>
          )}

          {/* Close button for mobile inside sidebar */}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen?.(false)}
              className="absolute right-4 p-1.5 md:hidden text-text-muted hover:text-text-primary hover:bg-surface-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen?.(false)}
                className={`flex items-center gap-3 px-3 rounded-lg text-[14px] font-medium
                  transition-all duration-200 ease-out relative group h-10
                  ${
                    isActive
                      ? "bg-surface-100 text-text-primary font-semibold"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-50"
                  } ${collapsed && !mobileOpen ? "justify-center" : ""}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-primary rounded-r-md" />
                )}
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                    isActive
                      ? "text-text-primary"
                      : "text-text-muted group-hover:text-text-secondary"
                  }`}
                />
                {(!collapsed || mobileOpen) && <span className="leading-none mt-0.5">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Streak Badge */}
        {(!collapsed || mobileOpen) && (
          <div className="mx-3 mb-3 p-3.5 rounded-xl bg-surface-50 border border-border-subtle shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-1">
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

        {/* Collapse Toggle (Desktop Only) */}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
          className="hidden md:flex items-center justify-center h-12 border-t border-border-default
            text-text-muted hover:text-text-primary hover:bg-surface-50 transition-colors bg-white w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>
    </>
  );
}
