"use client";

import { AuraBackground } from "./aura-background";
import { AppNavbar } from "./top-bar";
import { Dock } from "./dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ground transition-colors duration-300" dir="rtl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[100] focus:bg-[var(--accent)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        تخطي إلى المحتوى
      </a>

      <AuraBackground />
      <AppNavbar />

      <main
        id="main-content"
        className="px-4 sm:px-7 lg:px-10"
        style={{
          paddingTop: "calc(112px + 20px)",
          paddingBottom: "calc(80px + 32px)",
        }}
      >
        {children}
      </main>

      <Dock />
    </div>
  );
}

export default AppShell;
