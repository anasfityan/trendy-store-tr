"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!user && pathname !== "/login") {
      router.push("/login");
    }

    // Role-based route protection
    const adminOnlyRoutes = ["/customers", "/finance", "/settings"];
    if (user && user.role === "worker" && adminOnlyRoutes.some((r) => pathname.startsWith(r))) {
      router.push("/");
    }
  }, [user, pathname, router, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (!user && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">جاري التحويل...</div>
      </div>
    );
  }

  return <>{children}</>;
}
