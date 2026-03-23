"use client";

import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/theme";
import { useAuthStore } from "@/store/auth";

const pageTitles: Record<string, string> = {
  "/": "لوحة التحكم",
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
  return "متجر ترندي";
}

export function AppNavbar() {
  const pathname = usePathname();
  const { theme, toggle } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const title = getPageTitle(pathname);

  return (
    <header className="h-14 sm:h-16 sticky top-0 z-40 glass border-b border-[var(--border)] flex items-center px-4 sm:px-6 shrink-0">
      {/* Start: Page title */}
      <div className="flex-1">
        <h1 className="text-base sm:text-lg font-semibold">{title}</h1>
      </div>

      {/* Center: empty */}
      <div className="flex-1" />

      {/* End: Theme toggle + avatar */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-colors"
          title={theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
        >
          <Sun
            size={18}
            className="absolute transition-all duration-300"
            style={{
              transform: theme === "light" ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
              opacity: theme === "light" ? 1 : 0,
            }}
          />
          <Moon
            size={18}
            className="absolute transition-all duration-300"
            style={{
              transform: theme === "dark" ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0)",
              opacity: theme === "dark" ? 1 : 0,
            }}
          />
        </button>

        {/* User avatar */}
        {user && (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center text-sm font-bold">
            {user.name.charAt(0)}
          </div>
        )}
      </div>
    </header>
  );
}

export default AppNavbar;
