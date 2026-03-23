"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Store,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const navItems = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard, adminOnly: false },
  { href: "/orders", label: "الطلبات", icon: ShoppingCart, adminOnly: false },
  { href: "/batches", label: "الشحنات", icon: Package, adminOnly: false },
  { href: "/customers", label: "العملاء", icon: Users, adminOnly: true },
  { href: "/finance", label: "المالية", icon: DollarSign, adminOnly: true },
  { href: "/settings", label: "الإعدادات", icon: Settings, adminOnly: true },
];

const STORAGE_KEY = "trendy-sidebar-collapsed";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setCollapsed(stored === "true");
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin()) return false;
    return true;
  });

  return (
    <aside
      className={`hidden lg:flex flex-col glass border-s border-[var(--border)] transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[280px]"
      }`}
      style={{ height: "100%" }}
    >
      {/* Logo */}
      <div className="h-[72px] flex items-center gap-3 px-5 shrink-0 border-b border-[var(--border)]">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center shrink-0">
          <Store size={20} />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold whitespace-nowrap overflow-hidden">
            متجر ترندي
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && !collapsed && (
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center text-sm font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-[var(--muted)]">
                {user.role === "admin" ? "مدير" : "موظف"}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-secondary)] transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-[var(--border)]">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center p-2 rounded-xl text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-colors"
          title={collapsed ? "توسيع" : "طي"}
        >
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
