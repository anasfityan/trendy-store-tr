"use client";

import { useState } from "react";
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
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard, adminOnly: false },
  { href: "/orders", label: "الطلبات", icon: ShoppingCart, adminOnly: false },
  { href: "/batches", label: "الشحنات", icon: Package, adminOnly: false },
  { href: "/customers", label: "العملاء", icon: Users, adminOnly: true },
  { href: "/finance", label: "المالية", icon: DollarSign, adminOnly: true },
  { separator: true } as const,
  { href: "/settings", label: "الإعدادات", icon: Settings, adminOnly: true },
] as const;

type NavItem =
  | { href: string; label: string; icon: React.ComponentType<{ size?: number }>; adminOnly: boolean; separator?: undefined }
  | { separator: true; href?: undefined; label?: undefined; icon?: undefined; adminOnly?: undefined };

export function Dock() {
  const pathname = usePathname();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const filteredItems = (navItems as readonly NavItem[]).filter((item) => {
    if (item.separator) return true;
    if (item.adminOnly && !isAdmin()) return false;
    return true;
  });

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 1.25;
    if (distance === 1) return 1.15;
    if (distance === 2) return 1.05;
    return 1;
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="dock hidden md:flex">
        {filteredItems.map((item, index) => {
          if (item.separator) {
            return <div key={`sep-${index}`} className="dock-separator" />;
          }

          const Icon = item.icon;
          const active = isActive(item.href);
          const scale = getScale(index);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dock-item${active ? " active" : ""}`}
              style={{ transform: `scale(${scale})`, transition: "transform 200ms ease" }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="dock-icon">
                <Icon size={22} />
              </span>
              <span className="dock-label">{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}

export default Dock;
