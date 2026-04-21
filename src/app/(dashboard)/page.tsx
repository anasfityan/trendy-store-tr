"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Clock,
  TrendingUp,
  AlertCircle,
  Package,
  ArrowLeft,
} from "lucide-react";
import { formatIQD } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

interface DailyStat {
  date: string;
  label: string;
  count: number;
  revenue: number;
}

interface DashboardData {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    outstandingDebts: number;
  };
  openBatch: {
    id: string;
    name: string;
    status: string;
    boughtCount: number;
    totalCount: number;
  } | null;
  recentOrders: {
    id: string;
    productName: string | null;
    productType: string;
    status: string;
    sellingPrice: number;
    createdAt: string;
    customer: { name: string };
  }[];
  unpaidDelivered: {
    id: string;
    productName: string;
    sellingPrice: number;
    deposit: number;
    customer: { name: string; phone: string };
  }[];
  dailyStats: DailyStat[];
}

const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201,168,76,0.15)";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  new:         { label: "جديد",        bg: "rgba(59,130,246,0.12)", color: "#60a5fa" },
  in_progress: { label: "قيد التنفيذ", bg: "rgba(245,158,11,0.12)", color: "#fbbf24" },
  bought:      { label: "تم الشراء",   bg: "rgba(168,85,247,0.12)", color: "#c084fc" },
  shipped:     { label: "تم الشحن",    bg: "rgba(99,102,241,0.12)", color: "#a5b4fc" },
  delivered:   { label: "تم التسليم", bg: "rgba(34,197,94,0.12)",  color: "#4ade80" },
  cancelled:   { label: "ملغي",        bg: "rgba(248,113,113,0.12)", color: "#f87171" },
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-[var(--surface-secondary)] mb-4" />
      <div className="h-7 w-24 rounded-lg bg-[var(--surface-secondary)] mb-2" />
      <div className="h-3 w-16 rounded-lg bg-[var(--surface-secondary)]" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--accent)]/40 transition-colors duration-200"
    >
      <div
        className="inline-flex w-9 h-9 items-center justify-center rounded-xl mb-4"
        style={{ background: GOLD_DIM }}
      >
        <Icon size={16} style={{ color: GOLD }} />
      </div>
      <p className="text-[22px] font-bold text-[var(--foreground)] tabular-nums leading-none mb-1.5">
        {value}
      </p>
      <p className="text-xs text-[var(--muted)] font-medium">{label}</p>
    </div>
  );
}

function WeeklyBarChart({ data }: { data: DailyStat[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalWeek = data.reduce((s, d) => s + d.count, 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">آخر 7 أيام</h2>
        <span className="text-xs text-[var(--muted)] tabular-nums">
          {totalWeek} طلب هذا الأسبوع
        </span>
      </div>
      <div className="flex items-end gap-2 h-28" dir="ltr">
        {data.map((d) => {
          const heightPct =
            d.count > 0 ? Math.max((d.count / maxCount) * 100, 10) : 4;
          const isToday = d.date === today;
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center gap-1.5 group"
            >
              <span className="text-[10px] font-semibold text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity select-none">
                {d.count || ""}
              </span>
              <div className="w-full flex items-end" style={{ height: "88px" }}>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${heightPct}%`,
                    background: isToday
                      ? GOLD
                      : d.count > 0
                      ? "rgba(201,168,76,0.28)"
                      : "var(--surface-secondary)",
                  }}
                />
              </div>
              <span className="text-[10px] text-[var(--muted)] leading-none">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentOrdersList({
  orders,
}: {
  orders: DashboardData["recentOrders"];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">آخر الطلبات</h2>
        <a
          href="/orders"
          className="flex items-center gap-1 text-xs font-medium transition-colors duration-150"
          style={{ color: GOLD }}
        >
          عرض الكل
          <ArrowLeft size={12} />
        </a>
      </div>
      <div className="space-y-0">
        {orders.slice(0, 5).map((order, i) => {
          const s = STATUS_META[order.status] ?? {
            label: order.status,
            bg: "rgba(100,100,100,0.12)",
            color: "#999",
          };
          return (
            <div
              key={order.id}
              className="flex items-center gap-3 py-2.5"
              style={{
                borderBottom:
                  i < Math.min(orders.length, 5) - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate leading-tight">
                  {order.customer.name}
                </p>
                <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                  {order.productName || order.productType}
                </p>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: s.bg, color: s.color }}
              >
                {s.label}
              </span>
              <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums shrink-0">
                {formatIQD(order.sellingPrice)}
              </span>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="text-xs text-[var(--muted)] py-4 text-center">
            لا توجد طلبات حتى الآن
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 h-48 animate-pulse" />
          <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-[var(--muted)]">فشل تحميل البيانات</p>
      </div>
    );
  }

  const { stats, openBatch } = data;
  const batchProgress =
    openBatch && openBatch.totalCount > 0
      ? (openBatch.boughtCount / openBatch.totalCount) * 100
      : 0;

  const statCards = [
    { label: "إجمالي الطلبات",  value: stats.totalOrders.toString(), icon: ShoppingCart },
    { label: "الطلبات المعلقة", value: stats.pendingOrders.toString(), icon: Clock },
    { label: "الإيرادات",       value: formatIQD(stats.totalRevenue), icon: TrendingUp },
    { label: "الديون المستحقة", value: formatIQD(stats.outstandingDebts), icon: AlertCircle },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="stagger-children grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-in-up">
        {/* Bar chart */}
        <div className="lg:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {data.dailyStats ? (
            <WeeklyBarChart data={data.dailyStats} />
          ) : (
            <div className="h-36 flex items-center justify-center text-[var(--muted)] text-sm">
              لا توجد بيانات
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <RecentOrdersList orders={data.recentOrders} />
        </div>
      </div>

      {/* Open Batch */}
      {openBatch && (
        <div
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden animate-fade-in-up"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: GOLD_DIM }}
            >
              <Package size={16} style={{ color: GOLD }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                الشحنة المفتوحة: {openBatch.name}
              </p>
            </div>
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}
            >
              مفتوحة
            </span>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2.5">
              <span>
                {openBatch.boughtCount} من {openBatch.totalCount} طلب تم شراؤها
              </span>
              <span
                className="tabular-nums font-semibold"
                style={{ color: GOLD }}
              >
                {Math.round(batchProgress)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-secondary)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${batchProgress}%`, background: GOLD }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
