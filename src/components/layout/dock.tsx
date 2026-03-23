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
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const navItems = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard, adminOnly: false },
  { href: "/orders", label: "الطلبات", icon: ShoppingCart, adminOnly: false },
  { href: "/batches", label: "الشحنات", icon: Package, adminOnly: false },
  { href: "/finance", label: "المالية", icon: DollarSign, adminOnly: true },
  { href: "/customers", label: "العملاء", icon: Users, adminOnly: true },
  { href: "/settings", label: "النظام", icon: Settings, adminOnly: true },
];

export function Dock() {
  const pathname = usePathname();
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin()) return false;
    return true;
  });

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--border)] safe-bottom">
      <div className="flex items-center justify-center gap-1 sm:gap-2 px-4 py-2 max-w-lg mx-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 sm:px-4 py-1.5 rounded-xl transition-all relative ${
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {/* Active indicator line on top */}
              {active && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[var(--accent)]" />
              )}
              <Icon size={22} className="shrink-0" />
              <span className="text-[0.625rem] sm:text-xs font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default Dock;
