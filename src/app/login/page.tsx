"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { ShoppingBag, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "فشل تسجيل الدخول");
        return;
      }

      setAuth(data.user, data.token);
      router.push("/");
    } catch {
      setError("خطأ في الشبكة. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      {/* Aura background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="aura-blob aura-blob-1" />
        <div className="aura-blob aura-blob-2" />
        <div className="aura-blob aura-blob-3" />
        <div className="aura-blob aura-blob-4" />
        <div className="aura-blob aura-blob-5" />
      </div>

      <div className="relative w-full max-w-[420px] animate-fade-in-up">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--overlay-shadow)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-4 shadow-lg">
              <ShoppingBag className="w-7 h-7 text-[var(--accent-foreground)]" />
            </div>
            <h1 className="text-page-title">متجر ترندي</h1>
            <p className="text-stat-label mt-1">نظام الإدارة</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm animate-fade-in-scale">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none transition-all duration-150"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none transition-all duration-150"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-medium text-sm hover:opacity-90 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--separator)]">
            <p className="text-xs text-[var(--muted)] text-center">
              بيانات الدخول الافتراضية: admin/admin123 أو worker/worker123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
