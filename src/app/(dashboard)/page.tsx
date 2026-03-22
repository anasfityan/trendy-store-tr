"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  ShoppingCart,
  Clock,
  DollarSign,
  AlertCircle,
  MessageCircle,
  Package,
  FileText,
  CreditCard,
} from "lucide-react";
import { formatIQD } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

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
    productName: string;
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
}

const statusBadge: Record<string, { label: string; color: string }> = {
  new: { label: "جديد", color: "blue" },
  in_progress: { label: "قيد التنفيذ", color: "amber" },
  bought: { label: "تم الشراء", color: "purple" },
  shipped: { label: "تم الشحن", color: "indigo" },
  delivered: { label: "تم التسليم", color: "green" },
  cancelled: { label: "ملغي", color: "red" },
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-500",
  amber: "bg-amber-500/10 text-amber-500",
  purple: "bg-purple-500/10 text-purple-500",
  indigo: "bg-indigo-500/10 text-indigo-500",
  green: "bg-green-500/10 text-green-500",
  red: "bg-red-500/10 text-red-500",
  gray: "bg-gray-500/10 text-gray-500",
};

function SkeletonCard() {
  return (
    <div className="card-glow rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
          <div className="h-6 w-28 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="card-glow rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)]">
        <div className="h-5 w-40 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
        ))}
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
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonSection />
        <SkeletonSection />
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

  const { stats, openBatch, recentOrders, unpaidDelivered } = data;
  const batchProgress =
    openBatch && openBatch.totalCount > 0
      ? (openBatch.boughtCount / openBatch.totalCount) * 100
      : 0;

  const statCards = [
    {
      label: "إجمالي الطلبات",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "blue",
    },
    {
      label: "الطلبات المعلقة",
      value: stats.pendingOrders.toString(),
      icon: Clock,
      color: "amber",
    },
    {
      label: "الإيرادات",
      value: formatIQD(stats.totalRevenue),
      icon: DollarSign,
      color: "green",
    },
    {
      label: "الديون المستحقة",
      value: formatIQD(stats.outstandingDebts),
      icon: AlertCircle,
      color: "red",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-page-title">لوحة التحكم</h1>

      {/* Stats Grid */}
      <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const iconBg =
            stat.color === "blue"
              ? "bg-blue-500/10 text-blue-500"
              : stat.color === "amber"
              ? "bg-amber-500/10 text-amber-500"
              : stat.color === "green"
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500";

          return (
            <div
              key={stat.label}
              className="card-glow rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
            >
              <div className="flex items-center gap-3">
                <div className={`${iconBg} p-2.5 rounded-xl`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-stat-label">{stat.label}</p>
                  <p className="text-stat-value tabular-nums">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Open Batch Widget */}
      {openBatch && (
        <div className="card-glow rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-fade-in-up">
          <div className="flex items-center gap-2.5 px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)]">
            <div className="bg-purple-500/10 text-purple-500 p-2 rounded-xl">
              <Package className="h-5 w-5" />
            </div>
            <h2 className="text-section-title">الشحنة المفتوحة: {openBatch.name}</h2>
            <span className="bg-green-500/10 text-green-500 rounded-full px-2.5 py-0.5 text-xs font-semibold me-auto">
              {openBatch.status}
            </span>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                <span>
                  {openBatch.boughtCount} من {openBatch.totalCount} طلبات تم شراؤها
                </span>
                <span className="tabular-nums font-semibold">{Math.round(batchProgress)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card-glow rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-fade-in-up">
        <div className="flex items-center gap-2.5 px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)]">
          <div className="bg-blue-500/10 text-blue-500 p-2 rounded-xl">
            <FileText className="h-5 w-5" />
          </div>
          <h2 className="text-section-title">أحدث الطلبات</h2>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          {recentOrders.length === 0 ? (
            <p className="text-center text-[var(--muted)] py-8">لا توجد طلبات</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-start px-4 sm:px-6 pb-3 text-[var(--muted)] font-medium text-xs">العميل</th>
                    <th className="text-start px-4 pb-3 text-[var(--muted)] font-medium text-xs">المنتج</th>
                    <th className="text-start px-4 pb-3 text-[var(--muted)] font-medium text-xs">الحالة</th>
                    <th className="text-start px-4 pb-3 text-[var(--muted)] font-medium text-xs">السعر</th>
                    <th className="text-start px-4 sm:px-6 pb-3 text-[var(--muted)] font-medium text-xs">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const badge = statusBadge[order.status] ?? {
                      label: order.status,
                      color: "gray",
                    };
                    const badgeClass = colorMap[badge.color] ?? colorMap.gray;

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-secondary)] transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-3 font-medium">{order.customer?.name}</td>
                        <td className="px-4 py-3">{order.productName}</td>
                        <td className="px-4 py-3">
                          <span className={`${badgeClass} rounded-full px-2.5 py-0.5 text-xs font-semibold`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{formatIQD(order.sellingPrice)}</td>
                        <td className="px-4 sm:px-6 py-3 text-[var(--muted)]">
                          {format(new Date(order.createdAt), "dd MMM yyyy")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Unpaid Delivered Orders */}
      {unpaidDelivered.length > 0 && (
        <div className="card-glow rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-fade-in-up">
          <div className="flex items-center gap-2.5 px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)]">
            <div className="bg-red-500/10 text-red-500 p-2 rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-section-title">طلبات مسلّمة غير مدفوعة</h2>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-start px-4 sm:px-6 pb-3 text-[var(--muted)] font-medium text-xs">العميل</th>
                    <th className="text-start px-4 pb-3 text-[var(--muted)] font-medium text-xs">المنتج</th>
                    <th className="text-start px-4 pb-3 text-[var(--muted)] font-medium text-xs">المبلغ المستحق</th>
                    <th className="text-start px-4 pb-3 text-[var(--muted)] font-medium text-xs">الهاتف</th>
                    <th className="text-start px-4 sm:px-6 pb-3 text-[var(--muted)] font-medium text-xs">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidDelivered.map((order) => {
                    const amountOwed = order.sellingPrice - order.deposit;
                    const phone = order.customer?.phone?.replace(/[^0-9]/g, "");
                    const message = encodeURIComponent(
                      `مرحباً ${order.customer?.name}، نود تذكيرك بدفع المبلغ المتبقي لطلبك "${order.productName}" بقيمة ${formatIQD(amountOwed)}. نرجو إعلامنا بموعد الدفع المناسب. شكراً لك!`
                    );
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-secondary)] transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-3 font-medium">{order.customer?.name}</td>
                        <td className="px-4 py-3">{order.productName}</td>
                        <td className="px-4 py-3 tabular-nums">{formatIQD(amountOwed)}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{order.customer?.phone}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <a
                            href={`https://wa.me/${phone}?text=${message}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 rounded-full px-3 py-1 text-xs font-semibold hover:bg-green-500/20 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            واتساب
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
