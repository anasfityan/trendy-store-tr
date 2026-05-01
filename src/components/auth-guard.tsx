"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const checked = useRef(false);

  useEffect(() => {
    if (pathname === "/login") {
      setChecking(false);
      return;
    }

    // Already verified in this session — skip
    if (checked.current) {
      setChecking(false);
      return;
    }

    // User already in store (persisted) — no need to fetch
    if (user) {
      checked.current = true;
      setChecking(false);
      return;
    }

    // Try to restore session from cookie
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("no session");
      })
      .then((data) => {
        setAuth(data.user, "cookie");
        checked.current = true;
        setChecking(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [pathname]);

  // Role-based route protection
  useEffect(() => {
    if (!user) return;
    const adminOnlyRoutes = ["/customers", "/finance", "/settings"];
    if (user.role === "worker" && adminOnlyRoutes.some((r) => pathname.startsWith(r))) {
      router.replace("/");
    }
  }, [user, pathname]);

  if (checking && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="w-7 h-7 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "var(--accent)", borderRightColor: "var(--accent)" }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
