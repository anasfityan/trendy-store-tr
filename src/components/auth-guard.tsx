"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const pathname = usePathname();

  // Start as false if user already in store — avoids loading flash on navigation
  const [checking, setChecking] = useState(() => {
    if (pathname === "/login") return false;
    return !useAuthStore.getState().user;
  });

  useEffect(() => {
    if (pathname === "/login") {
      setChecking(false);
      return;
    }
    if (user) {
      setChecking(false);
      return;
    }
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("no session");
      })
      .then((data) => {
        setAuth(data.user, "cookie");
        setChecking(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [pathname, user]);

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
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return <>{children}</>;
}
