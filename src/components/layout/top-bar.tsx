"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, ShoppingBag, Search } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-40 glass border-b border-[var(--border)] shrink-0">
      {/* Main row */}
      <div className="flex items-center h-14 sm:h-16 px-4 sm:px-6 gap-3">
        {/* Right side: Logo + breadcrumb */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-base">ترندي</span>
            <span className="text-[var(--muted)]">›</span>
            <span className="text-[var(--muted)]">{title}</span>
          </div>
        </div>

        {/* Left side: User + theme + logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-all"
              title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
            >
              <Sun
                size={18}
                className="absolute transition-all duration-300"
                style={{
                  transform: isDark ? "rotate(90deg) scale(0)" : "rotate(0deg) scale(1)",
                  opacity: isDark ? 0 : 1,
                }}
              />
              <Moon
                size={18}
                className="absolute transition-all duration-300"
                style={{
                  transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0)",
                  opacity: isDark ? 1 : 0,
                }}
              />
            </button>
          )}

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="text-end hidden sm:block">
                <div className="text-sm font-semibold leading-tight">{user.name}</div>
                <div className="text-xs text-[var(--muted)] leading-tight">
                  {user.role === "admin" ? "مدير" : "موظف"}
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-sm font-bold">
                {user.name.charAt(0)}
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={() => logout()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-all"
            title="تسجيل خروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Search bar row */}
      <div className="px-4 sm:px-6 pb-3">
        <div className="flex items-center gap-2 w-full max-w-md px-4 py-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--muted)] text-sm cursor-text">
          <Search size={16} />
          <span>بحث أو أمر...</span>
          <kbd className="ms-auto text-xs bg-[var(--surface-tertiary)] px-1.5 py-0.5 rounded-md border border-[var(--border)]">⌘K</kbd>
        </div>
      </div>
    </header>
  );
}

export default AppNavbar;
