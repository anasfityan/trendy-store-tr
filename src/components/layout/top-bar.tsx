"use client";

import { usePathname } from "next/navigation";
import { Menu, Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { useState, useEffect } from "react";

const pageTitles: Record<string, string> = {
  "/": "لوحة التحكم",
  "/orders": "الطلبات",
  "/batches": "الشحنات",
  "/customers": "العملاء",
  "/finance": "المالية",
  "/settings": "الإعدادات",
};

interface TopBarProps {
  onMenuPress: () => void;
}

export default function TopBar({ onMenuPress }: TopBarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  const pageTitle =
    pageTitles[pathname] ??
    pageTitles[
      Object.keys(pageTitles).find(
        (key) => key !== "/" && pathname.startsWith(key)
      ) ?? "/"
    ] ?? "لوحة التحكم";

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-16 w-full items-center border-b border-[var(--glass-border)] glass px-3 sm:px-6 gap-2 sm:gap-4">
      {/* Start: Menu + Title */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="lg:hidden">
          <button
            onClick={onMenuPress}
            className="p-2.5 rounded-xl hover:bg-[var(--default)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <h1 className="text-lg font-semibold truncate">{pageTitle}</h1>
      </div>

      {/* End: Theme + User */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end">
        {/* Dark mode toggle */}
        {mounted && (
          <button
            onClick={toggle}
            className="relative p-2.5 rounded-xl hover:bg-[var(--default)] transition-colors overflow-hidden"
            aria-label="تبديل الوضع"
          >
            <div className="relative w-5 h-5">
              <Sun
                className={`absolute inset-0 h-5 w-5 transition-all duration-200 ease-in-out ${
                  isDark ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"
                }`}
              />
              <Moon
                className={`absolute inset-0 h-5 w-5 transition-all duration-200 ease-in-out ${
                  isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
                }`}
              />
            </div>
          </button>
        )}

        {/* User avatar */}
        {user && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15 text-sm font-bold text-[var(--accent)] cursor-pointer transition-transform hover:scale-105"
            title={user.name}
          >
            {user.name.charAt(0)}
          </div>
        )}
      </div>
    </header>
  );
}
