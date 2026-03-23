"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const navItems = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard, adminOnly: false },
  { href: "/orders", label: "الطلبات", icon: ShoppingCart, adminOnly: false },
  { href: "/batches", label: "الشحنات", icon: Package, adminOnly: false },
  { href: "/customers", label: "العملاء", icon: Users, adminOnly: true },
  { href: "/finance", label: "المالية", icon: DollarSign, adminOnly: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin()) return false;
    return true;
  });

  // Limit to 5 items max
  const visibleItems = filteredItems.slice(0, 5);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-[var(--border)] safe-bottom">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-colors ${
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)]"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-[var(--accent)] pulse-dot" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;
