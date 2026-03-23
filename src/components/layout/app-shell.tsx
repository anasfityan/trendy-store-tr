"use client";

import { AppSidebar } from "./sidebar";
import { AppNavbar } from "./top-bar";
import { Dock } from "./dock";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden" dir="rtl">
      {/* Sidebar - hidden on mobile, visible on lg+ */}
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <AppNavbar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Desktop dock */}
      <Dock />

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}

export default AppShell;
