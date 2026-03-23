"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Search, ShoppingBag, ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const pageTitles: Record<string, string> = {
  "/": "الرئيسية",
  "/orders": "الطلبات",
  "/batches": "الشحنات",
  "/customers": "العملاء",
  "/finance": "المالية",
  "/settings": "الإعدادات",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [path, title] of Object.entries(pageTitles)) {
    if (path !== "/" && pathname.startsWith(path)) return title;
  }
  return "الرئيسية";
}

export function AppNavbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const title = getPageTitle(pathname);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  const openCommandBar = useCallback(() => {
    window.dispatchEvent(new CustomEvent("toggle-command-bar"));
  }, []);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandBar();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [openCommandBar]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex flex-col bg-card/40 backdrop-blur-3xl border-b border-border/30"
      style={{ height: "112px" }}
    >
      {/* Row 1: Logo + Breadcrumb + Controls — 56px */}
      <div className="flex items-center justify-between px-4 sm:px-7 h-14 min-h-[56px]">
        {/* Right side: Logo + Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 text-white flex items-center justify-center">
            <ShoppingBag size={17} />
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-[var(--muted)]">
            <span className="font-bold text-base text-[var(--foreground)]">ترندي</span>
            <ChevronLeft size={14} strokeWidth={1.5} className="opacity-40" />
            <span className="font-medium text-[var(--foreground)]">{title}</span>
          </div>
          <span className="sm:hidden font-bold text-base text-[var(--foreground)]">ترندي</span>
        </div>

        {/* Left side: Search (mobile) + Theme + User + Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search icon */}
          <button
            onClick={openCommandBar}
            className="flex sm:hidden items-center justify-center w-9 h-9 rounded-xl text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-secondary)] transition-colors duration-200 cursor-pointer"
          >
            <Search size={18} strokeWidth={1.8} />
          </button>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-secondary)] transition-colors duration-200 cursor-pointer overflow-hidden"
              title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
            >
              <Sun
                size={17}
                strokeWidth={1.8}
                className="absolute transition-all duration-300"
                style={{
                  transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
                  opacity: isDark ? 1 : 0,
                }}
              />
              <Moon
                size={17}
                strokeWidth={1.8}
                className="absolute transition-all duration-300"
                style={{
                  transform: isDark ? "rotate(-90deg) scale(0)" : "rotate(0deg) scale(1)",
                  opacity: isDark ? 0 : 1,
                }}
              />
            </button>
          )}

          {/* User info */}
          {user && (
            <>
              <div className="text-start hidden sm:block">
                <p className="text-sm font-medium text-[var(--foreground)] leading-tight">{user.name}</p>
                <p className="text-[11px] text-[var(--muted)] leading-tight mt-0.5">
                  {user.role === "admin" ? "مدير" : user.role}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-sm font-bold">
                {user.name.charAt(0)}
              </div>
            </>
          )}

          {/* Logout */}
          <button
            onClick={() => logout()}
            title="تسجيل الخروج"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={17} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Row 2: Full-Width Omnibox — 56px (hidden on mobile) */}
      <div className="hidden sm:flex items-center px-7 h-14 min-h-[56px]">
        <button
          onClick={openCommandBar}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl bg-[var(--surface-secondary)]/80 border border-[var(--border)]/40 text-[var(--muted)] text-[15px] hover:border-[var(--muted)] hover:bg-[var(--surface-secondary)] transition-all duration-200 cursor-pointer"
        >
          <Search size={18} strokeWidth={1.8} className="shrink-0" />
          <span className="flex-1 text-start">بحث أو أمر...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-xs font-medium bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--muted)] font-mono">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}

export default AppNavbar;
