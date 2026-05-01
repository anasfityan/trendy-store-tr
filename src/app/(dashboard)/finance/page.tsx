"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useFinanceFilterStore } from "@/store/finance-filter";
import { formatIQD, formatUSD, formatTRY } from "@/lib/utils";
import { Package, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────

interface Order {
  purchaseCost: number;
  sellingPrice: number;
  deliveryCost: number;
  deposit: number;
}

interface Batch {
  id: string;
  name: string;
  status: string;
  closeDate: string | null;
  shippingCost: number;
  promotionCost: number;
  expenses: number;
  orders: Order[];
  _count: { orders: number };
}

interface Settings {
  usdToTry: number;
  usdToIqd: number;
}

// ─── Batch Card ───────────────────────────────────────────────

function BatchFinanceCard({ batch, settings }: { batch: Batch; settings: Settings }) {
  const { usdToTry, usdToIqd } = settings;

  // ── Purchases & Sales ──
  const totalPurchaseTRY = batch.orders.reduce((s, o) => s + o.purchaseCost, 0);
  const totalPurchaseUSD = usdToTry > 0 ? totalPurchaseTRY / usdToTry : 0;

  const totalSellIQD = batch.orders.reduce((s, o) => s + o.sellingPrice, 0);
  const totalSellUSD = usdToIqd > 0 ? totalSellIQD / usdToIqd : 0;

  // ── Costs ──
  const totalDeliveryIQD = batch.orders.reduce((s, o) => s + o.deliveryCost, 0);
  const totalDeliveryUSD = usdToIqd > 0 ? totalDeliveryIQD / usdToIqd : 0;

  const totalDepositIQD = batch.orders.reduce((s, o) => s + o.deposit, 0);
  const totalDepositUSD = usdToIqd > 0 ? totalDepositIQD / usdToIqd : 0;

  // ── Result ──
  const totalCostsUSD =
    totalPurchaseUSD + batch.shippingCost + batch.promotionCost + batch.expenses + totalDeliveryUSD;
  const netProfitUSD = totalSellUSD - totalCostsUSD;

  return (
    <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--background)]">
            <Package size={15} className="text-[var(--muted)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--foreground)] truncate">{batch.name}</p>
            <p className="text-[11px] text-[var(--muted)] font-mono mt-0.5">
              {batch._count.orders} طلب
              {batch.closeDate && (
                <span> · {format(new Date(batch.closeDate), "dd/MM/yyyy")}</span>
              )}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={11} />
          مكتملة
        </span>
      </div>

      {/* ── Purchases & Sales ── */}
      <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
        <div className="px-4 py-3 bg-[var(--surface)]">
          <p className="text-[10px] text-[var(--muted)] mb-1.5">إجمالي الشراء</p>
          <p className="text-[15px] font-bold text-[var(--foreground)] tabular-nums">
            {formatTRY(totalPurchaseTRY)}
          </p>
          <p className="text-[11px] text-[var(--muted)] tabular-nums mt-0.5">
            ≈ {formatUSD(totalPurchaseUSD)}
          </p>
        </div>
        <div className="px-4 py-3 bg-[var(--surface)]">
          <p className="text-[10px] text-[var(--muted)] mb-1.5">إجمالي البيع</p>
          <p className="text-[15px] font-bold tabular-nums text-emerald-500">
            {formatIQD(totalSellIQD)}
          </p>
          <p className="text-[11px] text-[var(--muted)] tabular-nums mt-0.5">
            ≈ {formatUSD(totalSellUSD)}
          </p>
        </div>
      </div>

      {/* ── Costs chips ── */}
      <div className="px-4 py-3 border-t border-[var(--border)] flex flex-wrap gap-2">
        <CostChip label="الشحن" value={formatUSD(batch.shippingCost)} />
        <CostChip label="الترويج" value={formatUSD(batch.promotionCost)} />
        <CostChip label="المصاريف" value={formatUSD(batch.expenses)} />
        <CostChip
          label="التوصيل"
          value={formatIQD(totalDeliveryIQD)}
          sub={formatUSD(totalDeliveryUSD)}
        />
        <CostChip
          label="العربون"
          value={formatIQD(totalDepositIQD)}
          sub={formatUSD(totalDepositUSD)}
        />
      </div>

      {/* ── Result ── */}
      <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
        <ResultCell
          label="إجمالي المبيعات"
          value={formatUSD(totalSellUSD)}
          color="#60a5fa"
        />
        <ResultCell
          label="إجمالي التكاليف"
          value={formatUSD(totalCostsUSD)}
          color="#f87171"
        />
        <ResultCell
          label="صافي الربح"
          value={formatUSD(netProfitUSD)}
          color={netProfitUSD >= 0 ? "#4ade80" : "#f87171"}
        />
      </div>
    </div>
  );
}

function CostChip({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col px-2.5 py-1.5 rounded-xl bg-[var(--background)] border border-[var(--border)] min-w-0">
      <span className="text-[9px] text-[var(--muted)] leading-none mb-1">{label}</span>
      <span className="text-[12px] font-semibold text-[var(--foreground)] tabular-nums leading-none">
        {value}
      </span>
      {sub && (
        <span className="text-[9px] text-[var(--muted)] tabular-nums leading-none mt-0.5">
          ≈ {sub}
        </span>
      )}
    </div>
  );
}

function ResultCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-3 py-3 bg-[var(--surface)] text-center">
      <p className="text-[9px] text-[var(--muted)] mb-1.5 leading-tight">{label}</p>
      <p className="text-[14px] font-bold tabular-nums leading-tight" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function FinancePage() {
  const { isAdmin } = useAuthStore();
  const { statusFilter, search } = useFinanceFilterStore();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [batchesRes, settingsRes] = await Promise.all([
          fetch("/api/batches"),
          fetch("/api/settings"),
        ]);
        if (batchesRes.ok) setBatches(await batchesRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-sm text-[var(--muted)]">صلاحية المسؤول مطلوبة.</p>
      </div>
    );
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-sm text-[var(--muted)]">جاري تحميل البيانات...</p>
      </div>
    );
  }

  const filtered = batches
    .filter((b) => statusFilter === "all" || b.status === statusFilter)
    .filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 pb-8" dir="rtl">
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-sm text-[var(--muted)]">لا توجد شحنات مطابقة.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {filtered.map((batch) => (
            <BatchFinanceCard key={batch.id} batch={batch} settings={settings} />
          ))}
        </div>
      )}
    </div>
  );
}
