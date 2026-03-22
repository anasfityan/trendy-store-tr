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
import { cn } from "@/lib/utils";

const navItems = [
  { label: "الرئيسية", icon: LayoutDashboard, href: "/", adminOnly: false },
  { label: "الطلبات", icon: ShoppingCart, href: "/orders", adminOnly: false },
  { label: "الشحنات", icon: Package, href: "/batches", adminOnly: false },
  { label: "العملاء", icon: Users, href: "/customers", adminOnly: true },
  { label: "المالية", icon: DollarSign, href: "/finance", adminOnly: true },
  { label: "الإعدادات", icon: Settings, href: "/settings", adminOnly: true },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuthStore();
  const admin = isAdmin();
  const visibleItems = navItems.filter((item) => !item.adminOnly || admin);

  return (
    <nav className="border-t border-[var(--glass-border)] glass safe-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-all duration-200",
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                {isActive && (
                  <span className="absolute -top-1 start-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--accent)] pulse-dot" />
                )}
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
