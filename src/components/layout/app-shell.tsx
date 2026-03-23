"use client";

import { AppNavbar } from "./top-bar";
import { Dock } from "./dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden" dir="rtl">
      {/* Top navbar */}
      <AppNavbar />

      {/* Main content — extra bottom padding for dock */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-28">
        {children}
      </main>

      {/* Bottom dock — the ONLY navigation */}
      <Dock />
    </div>
  );
}

export default AppShell;
