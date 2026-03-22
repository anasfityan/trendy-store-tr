"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Settings,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "لوحة التحكم", icon: LayoutDashboard, href: "/", adminOnly: false },
  { label: "الطلبات", icon: ShoppingCart, href: "/orders", adminOnly: false },
  { label: "الشحنات", icon: Package, href: "/batches", adminOnly: false },
  { label: "العملاء", icon: Users, href: "/customers", adminOnly: true },
  { label: "المالية", icon: DollarSign, href: "/finance", adminOnly: true },
  { label: "الإعدادات", icon: Settings, href: "/settings", adminOnly: true },
];

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  worker: "موظف",
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuthStore();
  const admin = isAdmin();
  const visibleItems = navItems.filter((item) => !item.adminOnly || admin);

  const content = (
    <div className="flex flex-col h-full w-[280px] glass border-s border-[var(--glass-border)] transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 h-[72px] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] shadow-lg">
            <ShoppingBag className="h-5 w-5 text-[var(--accent-foreground)]" />
          </div>
          <span className="text-lg font-bold tracking-tight">متجر ترندي</span>
        </div>
      </div>

      <div className="h-px bg-[var(--separator)]" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <div key={item.href} className="relative">
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-[var(--accent)]/10 transition-all duration-300" />
              )}
              <Link
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-3 rounded-xl text-base transition-colors hover:bg-[var(--default)]",
                  isActive
                    ? "text-[var(--accent)] font-semibold"
                    : "text-[var(--default-foreground)] opacity-60 hover:opacity-100"
                )}
              >
                <item.icon className={cn("w-6 h-6 shrink-0", isActive && "text-[var(--accent)]")} />
                <span className="truncate">{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="h-px bg-[var(--separator)]" />

      {/* User */}
      {user && (
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15 text-sm font-bold text-[var(--accent)] shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium truncate">{user.name}</p>
              <p className="text-xs text-[var(--muted)]">{roleLabels[user.role] || user.role}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--default)] hover:text-[var(--foreground)] transition-colors"
              title="خروج"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Mobile: drawer from right
  if (isMobile) {
    if (!isOpen) return null;
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 dialog-overlay"
          onClick={onClose}
        />
        <div className="fixed top-0 right-0 h-full z-50 animate-slide-in-right">
          {content}
        </div>
      </>
    );
  }

  // Desktop: static sidebar
  return <aside className="shrink-0 hidden lg:block">{content}</aside>;
}
