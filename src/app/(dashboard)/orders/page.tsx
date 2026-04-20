"use client";

import { useCallback, useEffect, useMemo, useRef, useState, FormEvent } from "react";
import {
  Copy, ExternalLink, ImageIcon, MessageCircle,
  FileText, Search, Plus, Trash2, X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Order {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  customer: { name: string; phone?: string; instagram?: string };
  productType: string;
  productName?: string;
  productLink?: string;
  images?: string;
  color?: string;
  size?: string;
  purchaseCost: number;
  sellingPrice: number;
  deliveryCost: number;
  deposit: number;
  governorate?: string;
  area?: string;
  notes?: string;
  instagramLink?: string;
  batchId?: string | null;
}

interface Batch { id: string; name: string; }

interface OrderForm {
  customerName: string; customerPhone: string; instagram: string;
  productType: string; productName: string; color: string; size: string;
  purchaseCost: string; sellingPrice: string; productLink: string;
  governorate: string; area: string; batchId: string;
  deliveryCost: string; deposit: string;
  status: string; paymentStatus: string; notes: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  Bag: "حقيبة", Shoe: "حذاء", Clothing: "ملابس", Accessory: "إكسسوار", Other: "أخرى",
};

const STATUS_OPTIONS = [
  { value: "new",         label: "جديد" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "bought",      label: "تم الشراء" },
  { value: "shipped",     label: "تم الشحن" },
  { value: "delivered",   label: "تم التسليم" },
];

const PAYMENT_OPTIONS = [
  { value: "unpaid",  label: "غير مدفوع" },
  { value: "partial", label: "دفع جزئي" },
  { value: "paid",    label: "مدفوع" },
];

const PRODUCT_TYPES = [
  { value: "Bag", label: "حقيبة" }, { value: "Shoe", label: "حذاء" },
  { value: "Clothing", label: "ملابس" }, { value: "Accessory", label: "إكسسوار" },
  { value: "Other", label: "أخرى" },
];

const IRAQI_CITIES = [
  "بغداد","البصرة","أربيل","الموصل","النجف","كربلاء",
  "السليمانية","دهوك","كركوك","الأنبار","بابل","ديالى",
  "ذي قار","القادسية","المثنى","ميسان","واسط","صلاح الدين",
];

const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-100   text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  bought:      "bg-purple-100 text-purple-700",
  shipped:     "bg-orange-100 text-orange-700",
  delivered:   "bg-green-100  text-green-700",
};

const EMPTY_FORM: OrderForm = {
  customerName: "", customerPhone: "", instagram: "",
  productType: "Bag", productName: "", color: "", size: "",
  purchaseCost: "", sellingPrice: "", productLink: "",
  governorate: "", area: "", batchId: "",
  deliveryCost: "", deposit: "",
  status: "new", paymentStatus: "unpaid", notes: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
}

function firstImage(images?: string): string | null {
  if (!images) return null;
  try { return (JSON.parse(images) as string[])[0] ?? null; } catch { return null; }
}

// Returns color name, or "—" if it's a hex/rgb value or empty
function displayColor(color?: string): string {
  if (!color) return "—";
  const t = color.trim();
  if (!t || /^#[0-9a-f]{3,8}$/i.test(t) || /^rgb/i.test(t)) return "—";
  return t;
}

function formatIQD(n: number): string {
  return n.toLocaleString() + " د.ع";
}

function buildWhatsAppUrl(order: Order): string {
  const phone = (order.customer.phone ?? "").replace(/\D/g, "");
  const remaining = order.sellingPrice + order.deliveryCost - order.deposit;
  const text = encodeURIComponent(
    `مرحباً ${order.customer.name}،\n` +
    `المنتج: ${TYPE_LABELS[order.productType] ?? order.productType}` +
    (order.color ? ` - ${order.color}` : "") + (order.size ? ` / ${order.size}` : "") + `\n` +
    `السعر: ${formatIQD(order.sellingPrice)}\n` +
    (order.deliveryCost ? `التوصيل: ${formatIQD(order.deliveryCost)}\n` : "") +
    (order.deposit ? `العربون: ${formatIQD(order.deposit)}\n` : "") +
    `المتبقي: ${formatIQD(remaining)}\nشكراً!`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

function openInvoice(order: Order): void {
  const remaining = order.sellingPrice + order.deliveryCost - order.deposit;
  const img = firstImage(order.images);
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/>
<title>فاتورة</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;padding:40px;max-width:600px;margin:0 auto;direction:rtl}
.title{text-align:center;font-size:22px;font-weight:700;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:20px}
.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #ccc}
.bold{font-weight:600}.total{font-size:18px;font-weight:700;padding-top:12px;border-bottom:none}
img{max-width:160px;display:block;margin:16px auto;border-radius:8px}
</style></head><body>
<div class="title">متجر ترندي — فاتورة</div>
${img ? `<img src="${img}" alt=""/>` : ""}
<div class="row"><span>العميل</span><span class="bold">${order.customer.name}</span></div>
<div class="row"><span>المنتج</span><span class="bold">${TYPE_LABELS[order.productType] ?? order.productType}${order.color ? " - " + order.color : ""}${order.size ? " / " + order.size : ""}</span></div>
<div class="row"><span>سعر البيع</span><span class="bold">${formatIQD(order.sellingPrice)}</span></div>
<div class="row"><span>التوصيل</span><span class="bold">${formatIQD(order.deliveryCost)}</span></div>
<div class="row"><span>العربون</span><span class="bold">${formatIQD(order.deposit)}</span></div>
<div class="row total"><span>المتبقي للدفع</span><span>${formatIQD(remaining)}</span></div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

// ---------------------------------------------------------------------------
// Input / Select helper components (keeps JSX compact)
// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-8 rounded border border-border px-2 text-sm bg-background outline-none focus:ring-2 focus:ring-accent/50";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const { token, isAdmin } = useAuthStore();

  const [orders, setOrders]           = useState<Order[]>([]);
  const [batches, setBatches]         = useState<Batch[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [statusDropId, setStatusDropId] = useState<string | null>(null);
  const [previewImg, setPreviewImg]   = useState<string | null>(null);
  const [formOpen, setFormOpen]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState<OrderForm>(EMPTY_FORM);

  // ref used to detect clicks outside the open status dropdown
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then((data: Order[]) => setOrders(data))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Fetch batches ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch("/api/batches", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBatches(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  // ── Close status dropdown on outside click ────────────────────────────────
  useEffect(() => {
    if (!statusDropId) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setStatusDropId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusDropId]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      o.customer.name.toLowerCase().includes(q) ||
      (o.customer.phone ?? "").includes(q) ||
      (o.customer.instagram ?? "").toLowerCase().includes(q)
    );
  }, [orders, search]);

  // ── Status update ─────────────────────────────────────────────────────────
  const setStatus = useCallback(async (id: string, prev: string, next: string) => {
    setStatusDropId(null);
    if (prev === next) return;
    setUpdatingId(id);
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: next } : o)));
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: prev } : o)));
    } finally {
      setUpdatingId(null);
    }
  }, [token]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (order: Order) => {
    if (!confirm(`حذف طلب "${order.customer.name}"؟`)) return;
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders((os) => os.filter((o) => o.id !== order.id));
      else alert("فشل الحذف");
    } catch { alert("خطأ في الشبكة"); }
  }, [token]);

  // ── Add order form ────────────────────────────────────────────────────────
  const setField = (k: keyof OrderForm, v: string) =>
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "governorate")
        next.deliveryCost = v === "بغداد" ? "5000" : v ? "6000" : f.deliveryCost;
      return next;
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const igHandle = form.instagram.includes("instagram.com/")
        ? (form.instagram.match(/instagram\.com\/([^/?#]+)/)?.[1] ?? form.instagram)
        : form.instagram.replace(/^@/, "");
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerInstagram: igHandle,
          productType: form.productType,
          productName: form.productName,
          color: form.color,
          size: form.size,
          purchaseCost: form.purchaseCost,
          sellingPrice: form.sellingPrice,
          productLink: form.productLink,
          instagramLink: form.instagram,
          governorate: form.governorate,
          area: form.area,
          batchId: form.batchId || null,
          deliveryCost: form.deliveryCost,
          deposit: form.deposit,
          phone: form.customerPhone,
          status: form.status,
          paymentStatus: form.paymentStatus,
          notes: form.notes,
        }),
      });
      if (res.ok) { setFormOpen(false); setForm(EMPTY_FORM); fetchOrders(); }
      else { const err = await res.json().catch(() => null); alert(err?.error ?? "فشل في حفظ الطلب"); }
    } catch { alert("خطأ في الشبكة"); }
    finally { setSaving(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <p className="p-8 text-muted-foreground">جارٍ التحميل…</p>;
  if (error)   return <p className="p-8 text-destructive">{error}</p>;

  return (
    <div className="p-4 space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">الطلبات</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filtered.length !== orders.length ? `${filtered.length} / ` : ""}{orders.length} طلب
          </span>
          <button
            onClick={() => { setForm(EMPTY_FORM); setFormOpen(true); }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            طلب جديد
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="بحث بالاسم أو الهاتف أو انستغرام…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 rounded-md border border-border bg-background pe-9 ps-3 text-sm outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted text-muted-foreground border-b border-border">
              <th className="px-2 py-2 text-start w-12">صورة</th>
              <th className="px-2 py-2 text-start w-14">النوع</th>
              <th className="px-2 py-2 text-start">اللون / المقاس</th>
              <th className="px-2 py-2 text-start">العميل</th>
              <th className="px-2 py-2 text-start w-20">الربح</th>
              <th className="px-2 py-2 text-start w-14">شراء ₺</th>
              <th className="px-2 py-2 text-start w-20">بيع د.ع</th>
              <th className="px-2 py-2 text-start w-10">رابط</th>
              <th className="px-2 py-2 text-start w-24">الحالة</th>
              <th className="px-2 py-2 text-start w-16">التاريخ</th>
              <th className="px-2 py-2 text-start w-20">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const img       = firstImage(o.images);
              const color     = displayColor(o.color);
              const profit    = o.sellingPrice - o.purchaseCost;
              const phone     = (o.customer.phone ?? "").replace(/\D/g, "");
              const statusOpt = STATUS_OPTIONS.find((s) => s.value === o.status);

              return (
                <tr key={o.id} className="border-t border-border hover:bg-accent/20 transition-colors">

                  {/* Image */}
                  <td className="px-2 py-1.5">
                    {img ? (
                      <button type="button" onClick={() => setPreviewImg(img)}>
                        <img src={img} alt="" className="h-10 w-10 rounded object-cover" />
                      </button>
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-2 py-1.5 font-medium whitespace-nowrap">
                    {TYPE_LABELS[o.productType] ?? o.productType}
                  </td>

                  {/* Color / Size — same cell */}
                  <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                    {color}{o.size ? <span className="ms-1">/ {o.size}</span> : null}
                  </td>

                  {/* Customer + copy */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <span className="font-medium truncate max-w-[5.5rem]">{o.customer.name}</span>
                      <button
                        type="button"
                        title="نسخ"
                        onClick={() => navigator.clipboard.writeText(o.customer.name)}
                        className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </td>

                  {/* Profit */}
                  <td className={`px-2 py-1.5 font-mono whitespace-nowrap ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {profit.toLocaleString()}
                  </td>

                  {/* Purchase cost */}
                  <td className="px-2 py-1.5 font-mono">{o.purchaseCost.toLocaleString()}</td>

                  {/* Selling price */}
                  <td className="px-2 py-1.5 font-mono whitespace-nowrap">{o.sellingPrice.toLocaleString()}</td>

                  {/* Product link */}
                  <td className="px-2 py-1.5">
                    {o.productLink ? (
                      <a href={o.productLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-accent hover:underline">
                        <ExternalLink className="h-3 w-3" />فتح
                      </a>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>

                  {/* Status — dropdown on click */}
                  <td className="px-2 py-1.5">
                    <div className="relative" ref={statusDropId === o.id ? dropRef : undefined}>
                      <button
                        type="button"
                        disabled={updatingId === o.id}
                        onClick={() => setStatusDropId(statusDropId === o.id ? null : o.id)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                          ${STATUS_COLORS[o.status] ?? "bg-muted text-muted-foreground"}
                          ${updatingId === o.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
                      >
                        {statusOpt?.label ?? o.status}
                      </button>
                      {statusDropId === o.id && (
                        <div className="absolute z-50 top-full mt-1 start-0 bg-background border border-border rounded-lg shadow-lg overflow-hidden min-w-[9rem]">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => setStatus(o.id, o.status, s.value)}
                              className={`w-full text-start px-3 py-1.5 text-xs hover:bg-accent transition-colors
                                ${o.status === s.value ? "font-semibold text-accent" : ""}`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                    {fmtDate(o.createdAt)}
                  </td>

                  {/* Action buttons */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-0.5">
                      {phone && (
                        <a href={buildWhatsAppUrl(o)} target="_blank" rel="noopener noreferrer"
                          title="واتساب"
                          className="p-1 rounded hover:bg-accent transition-colors text-green-600">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button type="button" title="طباعة" onClick={() => openInvoice(o)}
                        className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" title="نسخ الاسم"
                        onClick={() => navigator.clipboard.writeText(o.customer.name)}
                        className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {isAdmin() && (
                        <button type="button" title="حذف" onClick={() => handleDelete(o)}
                          className="p-1 rounded hover:bg-destructive/10 transition-colors text-destructive/60 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {search ? "لا توجد نتائج" : "لا توجد طلبات"}
          </p>
        )}
      </div>

      {/* ── Image preview ─────────────────────────────────────────────────── */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setPreviewImg(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImg}
              alt=""
              className="max-w-sm max-h-[70vh] rounded-xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute -top-2.5 -right-2.5 bg-background border border-border rounded-full p-1 shadow hover:bg-accent transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Add Order dialog ──────────────────────────────────────────────── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-sm">طلب جديد</h2>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-sm">

              {/* Customer */}
              <div className="grid grid-cols-3 gap-2">
                <Field label="الاسم *">
                  <input required value={form.customerName}
                    onChange={(e) => setField("customerName", e.target.value)} className={inputCls} />
                </Field>
                <Field label="الهاتف">
                  <input value={form.customerPhone}
                    onChange={(e) => setField("customerPhone", e.target.value)} className={inputCls} />
                </Field>
                <Field label="انستغرام">
                  <input dir="ltr" value={form.instagram}
                    onChange={(e) => setField("instagram", e.target.value)}
                    className={inputCls + " text-left"} />
                </Field>
              </div>

              {/* Product */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="النوع">
                  <select value={form.productType}
                    onChange={(e) => setField("productType", e.target.value)} className={inputCls}>
                    {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="اللون">
                  <input value={form.color}
                    onChange={(e) => setField("color", e.target.value)} className={inputCls} />
                </Field>
                <Field label="المقاس">
                  <input value={form.size}
                    onChange={(e) => setField("size", e.target.value)} className={inputCls} />
                </Field>
                <Field label="رابط المنتج">
                  <input dir="ltr" value={form.productLink}
                    onChange={(e) => setField("productLink", e.target.value)}
                    className={inputCls + " text-left"} />
                </Field>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="سعر الشراء ₺">
                  <input type="number" step="0.01" min="0" value={form.purchaseCost}
                    onChange={(e) => setField("purchaseCost", e.target.value)} className={inputCls} />
                </Field>
                <Field label="سعر البيع د.ع">
                  <input type="number" step="1" min="0" value={form.sellingPrice}
                    onChange={(e) => setField("sellingPrice", e.target.value)} className={inputCls} />
                </Field>
              </div>

              {/* Location */}
              <div className="grid grid-cols-3 gap-2">
                <Field label="المحافظة">
                  <select value={form.governorate}
                    onChange={(e) => setField("governorate", e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    {IRAQI_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="المنطقة">
                  <input value={form.area}
                    onChange={(e) => setField("area", e.target.value)} className={inputCls} />
                </Field>
                <Field label="الشحنة">
                  <select value={form.batchId}
                    onChange={(e) => setField("batchId", e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
              </div>

              {/* Delivery + deposit + remaining */}
              <div className="grid grid-cols-3 gap-2 items-end">
                <Field label="توصيل د.ع">
                  <select value={form.deliveryCost}
                    onChange={(e) => setField("deliveryCost", e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    <option value="5000">5,000</option>
                    <option value="6000">6,000</option>
                  </select>
                </Field>
                <Field label="عربون د.ع">
                  <input type="number" step="1" min="0" value={form.deposit}
                    onChange={(e) => setField("deposit", e.target.value)} className={inputCls} />
                </Field>
                <div className="rounded-lg bg-accent text-accent-foreground px-3 py-1.5 text-center">
                  <div className="text-[10px] opacity-70">المتبقي</div>
                  <div className="font-bold">
                    {formatIQD(
                      (parseFloat(form.sellingPrice) || 0) +
                      (parseFloat(form.deliveryCost) || 0) -
                      (parseFloat(form.deposit) || 0)
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="الحالة">
                  <select value={form.status}
                    onChange={(e) => setField("status", e.target.value)} className={inputCls}>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
                <Field label="الدفع">
                  <select value={form.paymentStatus}
                    onChange={(e) => setField("paymentStatus", e.target.value)} className={inputCls}>
                    {PAYMENT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
              </div>

              {/* Notes */}
              <Field label="ملاحظات">
                <textarea value={form.notes} rows={2}
                  onChange={(e) => setField("notes", e.target.value)}
                  className="w-full rounded border border-border px-2 py-1.5 text-sm bg-background outline-none focus:ring-2 focus:ring-accent/50 resize-none" />
              </Field>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setFormOpen(false)}
                  className="h-8 px-3 rounded border border-border text-sm hover:bg-accent transition-colors">
                  إلغاء
                </button>
                <button type="submit" disabled={saving}
                  className="h-8 px-4 rounded bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50">
                  {saving ? "جارٍ الحفظ…" : "إنشاء"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
