"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Box } from "lucide-react";
import { formatIQD } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

const PENDING_STATUSES = ["new", "in_progress", "bought", "shipped"] as const;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new:         { label: "جديد",        color: "#60a5fa", bg: "rgba(59,130,246,0.10)" },
  in_progress: { label: "قيد التنفيذ", color: "#fbbf24", bg: "rgba(251,191,36,0.10)" },
  bought:      { label: "تم الشراء",   color: "#c084fc", bg: "rgba(192,132,252,0.10)" },
  shipped:     { label: "تم الشحن",    color: "#818cf8", bg: "rgba(129,140,248,0.10)" },
};

interface Order {
  id: string;
  status: string;
  sellingPrice: number;
  deposit: number;
  productName: string | null;
  productType: string;
  createdAt: string;
  customer: { name: string; phone: string };
  batch: { name: string } | null;
}

// ─── Tab: Pending Orders ─────────────────────────────────────

function PendingTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data: Order[]) =>
        setOrders(data.filter((o) => PENDING_STATUSES.includes(o.status as typeof PENDING_STATUSES[number])))
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-[var(--muted)]">جاري التحميل...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <AlertCircle size={32} strokeWidth={1.5} className="text-[var(--muted)]" />
        <p className="text-sm text-[var(--muted)]">لا توجد طلبات معلقة</p>
      </div>
    );
  }

  const grouped = PENDING_STATUSES.reduce<Record<string, Order[]>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {PENDING_STATUSES.map((status) => {
        const group = grouped[status];
        if (!group?.length) return null;
        const meta = STATUS_META[status];
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
              <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
              <span className="text-[11px] text-[var(--muted)] tabular-nums">{group.length}</span>
            </div>
            <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
              {group.map((order, i) => (
                <div
                  key={order.id}
                  onClick={() => router.push("/orders")}
                  className="flex items-center gap-3 px-4 py-3 bg-[var(--surface)] cursor-pointer hover:bg-[var(--surface-secondary)] transition-colors"
                  style={{ borderBottom: i < group.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate leading-tight">
                      {order.customer.name}
                    </p>
                    <p className="text-[11px] text-[var(--muted)] truncate leading-tight mt-0.5">
                      {order.productName || order.productType}
                    </p>
                  </div>
                  {order.batch && (
                    <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: "var(--surface-secondary)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                      {order.batch.name}
                    </span>
                  )}
                  <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: "#c9a84c" }}>
                    {formatIQD(order.sellingPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Warehouse ───────────────────────────────────────────

function WarehouseTab() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <Box size={36} strokeWidth={1.2} className="text-[var(--muted)]" />
      <p className="text-sm font-semibold text-[var(--foreground)]">المخزن</p>
      <p className="text-xs text-[var(--muted)] text-center max-w-[220px]">
        قريباً — إدارة المخزون وتتبع المنتجات
      </p>
    </div>
  );
}

// ─── Tabs bar ─────────────────────────────────────────────────

const TABS = [
  { id: "pending",   label: "المعلق" },
  { id: "warehouse", label: "المخزن" },
];

// ─── Page ─────────────────────────────────────────────────────

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <div className="space-y-4 pb-8" dir="rtl">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--surface)]" style={{ border: "1px solid var(--border)" }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: active ? "#c9a84c" : "transparent",
                color: active ? "#111111" : "var(--muted)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "pending"   && <PendingTab />}
      {activeTab === "warehouse" && <WarehouseTab />}
    </div>
  );
}
