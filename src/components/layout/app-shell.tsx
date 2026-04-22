"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuraBackground } from "./aura-background";
import { AppNavbar } from "./top-bar";
import { Dock } from "./dock";
import { useDir } from "@/lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dir = useDir();

  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isReload = nav?.type === "reload";
    if (isReload && pathname !== "/") {
      router.replace("/");
    }
  }, []);

  return (
    <div className="min-h-dvh bg-ground transition-colors duration-300" dir={dir}>
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
          paddingTop: "calc(56px + 20px)",
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
