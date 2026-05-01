"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  Download,
  Store,
  Percent,
  Database,
  Search,
  X,
  ChevronLeft,
  LogOut,
  Upload,
  Languages,
  FileText,
  Code2,
  Eye,
  RotateCcw,
} from "lucide-react";
import {
  INVOICE_TEMPLATES,
  SAMPLE_INVOICE_ORDER,
  buildInvoiceVars,
  renderTemplate,
  CLASSIC_TEMPLATE,
} from "@/lib/invoice-templates";
import { useT } from "@/lib/i18n";
import { useLocaleStore } from "@/store/locale";

interface SettingsData {
  id: string;
  storeName: string;
  logo: string | null;
  phone: string | null;
  instagram: string | null;
  city: string | null;
  usdToTry: number;
  usdToIqd: number;
  tryToIqd: number;
  invoiceTemplate: string | null;
}

// ─── Phone normalization ──────────────────────────────────────
function normalizeIraqiPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Already has full country code (964 + 10 digits = 13)
  if (digits.startsWith("9647") && digits.length === 13) return "+" + digits;
  if (digits.startsWith("964") && digits.length >= 12) return "+" + digits;
  // Local mobile: 07XXXXXXXXX (10 digits)
  if (digits.startsWith("0") && digits.length === 10) return "+964" + digits.slice(1);
  // Without leading zero: 7XXXXXXXXX (10 digits)
  if (digits.startsWith("7") && digits.length === 10) return "+964" + digits;
  // Best effort
  return "+" + digits;
}

// ─── CSV helpers ─────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const vals: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (c === ',' && !inQ) {
      vals.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  vals.push(cur.trim());
  return vals;
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.replace(/^﻿/, "").trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const vals = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return row;
    });
}

export default function SettingsPage() {
  const { isAdmin, logout, user } = useAuthStore();
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocaleStore();

  const categories = [
    { key: "store",     label: t.settings.categories.store.label,     icon: Store,     description: t.settings.categories.store.description },
    { key: "financial", label: t.settings.categories.financial.label, icon: Percent,   description: t.settings.categories.financial.description },
    { key: "invoice",   label: t.settings.categories.invoice.label,   icon: FileText,  description: t.settings.categories.invoice.description },
    { key: "system",    label: t.settings.categories.system.label,    icon: Database,  description: t.settings.categories.system.description },
  ];
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState("store");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileContent, setShowMobileContent] = useState(false);

  // Form fields
  const [storeName, setStoreName] = useState("");
  const [logo, setLogo] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeInstagram, setStoreInstagram] = useState("");
  const [storeCity, setStoreCity] = useState("");
  const [usdToTry, setUsdToTry] = useState("");
  const [usdToIqd, setUsdToIqd] = useState("");
  const [tryToIqd, setTryToIqd] = useState("");

  // Invoice template
  const [invoiceTemplate, setInvoiceTemplate] = useState("");
  const [invoicePreviewMode, setInvoicePreviewMode] = useState(false);

  // CSV import
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Meta export
  const [exportingMeta, setExportingMeta] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data: SettingsData = await res.json();
          setSettings(data);
          setStoreName(data.storeName || "");
          setLogo(data.logo || "");
          setStorePhone(data.phone || "");
          setStoreInstagram(data.instagram || "");
          setStoreCity(data.city || "");
          setUsdToTry(String(data.usdToTry));
          setUsdToIqd(String(data.usdToIqd));
          setTryToIqd(String(data.tryToIqd));
          if (data.invoiceTemplate) setInvoiceTemplate(data.invoiceTemplate);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[var(--muted)]">{t.settings.adminRequired}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[var(--muted)]">{t.settings.loading}</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          logo: logo || null,
          phone: storePhone || null,
          instagram: storeInstagram || null,
          city: storeCity || null,
          usdToTry: parseFloat(usdToTry),
          usdToIqd: parseFloat(usdToIqd),
          tryToIqd: parseFloat(tryToIqd),
          invoiceTemplate: invoiceTemplate || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      const res = await fetch("/api/settings/backup");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `trendy-store-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export database error:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setImportMsg({ ok: false, text: t.settings.system.importEmptyFile });
        return;
      }
      const customers = rows.map((row) => ({
        name: row["fn"] || row["name"] || "",
        phone: row["phone"] || "",
        phone2: row["phone2"] || "",
        instagram: row["instagram"] || "",
        city: row["city"] || "",
      }));
      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: customers }),
      });
      if (!res.ok) throw new Error("server error");
      const { imported, skipped } = await res.json();
      setImportMsg({ ok: true, text: t.settings.system.importSuccess(imported, skipped) });
    } catch {
      setImportMsg({ ok: false, text: t.settings.system.importError });
    } finally {
      setImporting(false);
    }
  };

  const handleExportMeta = async () => {
    setExportingMeta(true);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("fetch failed");
      const customers: { name: string; phone?: string | null }[] = await res.json();

      const header = "phone,phone2,fn";
      const rows = customers.map((c) => {
        const phone = normalizeIraqiPhone(c.phone);
        const name = (c.name ?? "").replace(/,/g, " ");
        return `${phone},,${name}`;
      });
      const csv = [header, ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meta_audience.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Meta export error:", err);
    } finally {
      setExportingMeta(false);
    }
  };

  const filteredCategories = searchQuery.trim()
    ? categories.filter(
        (c) =>
          c.label.includes(searchQuery) || c.description.includes(searchQuery)
      )
    : categories;

  const activeCatLabel =
    categories.find((c) => c.key === activeCategory)?.label ?? "";

  return (
    <div className="space-y-5 stagger-grid">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--navy)]">
            {t.settings.title}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {t.settings.subtitle}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--navy)] text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-60 transition-colors cursor-pointer"
        >
          <Save size={16} />
          {saving ? t.settings.saving : saved ? t.settings.saved : t.settings.save}
        </button>
      </div>

      {/* Settings Layout — Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-28 space-y-3">
            {/* Profile card */}
            {user && (
              <div
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-base font-bold shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user.name}</p>
                  <p className="text-[11px] text-[var(--muted)] truncate">{user.role === "admin" ? t.settings.roleAdmin : user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title={t.settings.system.logoutTitle}
                  className="flex items-center justify-center w-8 h-8 rounded-xl text-[var(--muted)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut size={16} strokeWidth={1.8} />
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="search"
                placeholder={t.settings.searchPlaceholder}
                className="w-full pr-10 pl-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--navy)]/40 focus:bg-[var(--surface)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category list */}
            <div
              className="bg-[var(--surface)] rounded-2xl overflow-hidden"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              {filteredCategories.map((cat, i) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-start transition-all duration-200 cursor-pointer relative group ${
                      isActive
                        ? "bg-[var(--navy)]/8 text-[var(--navy)]"
                        : "text-[var(--muted)] hover:bg-[var(--background)]/80 hover:text-[var(--foreground)]"
                    } ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute right-0 top-2 bottom-2 w-[3px] rounded-l-full bg-[var(--navy)]" />
                    )}

                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isActive
                          ? "bg-[var(--navy)]/12"
                          : "bg-[var(--background)] group-hover:bg-[var(--navy)]/5"
                      }`}
                    >
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold truncate">
                        {cat.label}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="py-8 text-center text-sm text-[var(--muted)]">
                  {t.settings.noResults}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile: Category List */}
        <div className={`lg:hidden ${showMobileContent ? "hidden" : "block"}`}>
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="search"
              placeholder={t.settings.searchPlaceholder}
              className="w-full pr-10 pl-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--navy)]/40 transition-all"
              style={{ boxShadow: "var(--shadow-xs)" }}
            />
          </div>

          <div className="space-y-2">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    setShowMobileContent(true);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-[var(--surface)] rounded-2xl text-start transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--navy)]/8 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-[var(--navy)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {cat.label}
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {cat.description}
                    </p>
                  </div>
                  <ChevronLeft
                    size={16}
                    className="text-[var(--muted)] shrink-0 rotate-180"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile: Content with back button */}
        <div className={`lg:hidden ${showMobileContent ? "block" : "hidden"}`}>
          <button
            onClick={() => setShowMobileContent(false)}
            className="flex items-center gap-2 text-sm text-[var(--navy)] font-medium mb-4 cursor-pointer hover:opacity-80 transition-colors"
          >
            <ChevronLeft size={16} />
            {t.settings.back}
          </button>
          <div className="space-y-5 stagger-content">
            {renderContent()}
          </div>
        </div>

        {/* Desktop: Content Area */}
        <div className="hidden lg:block flex-1 min-w-0">
          <div className="space-y-5 stagger-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );

  function renderContent() {
    switch (activeCategory) {
      case "store":
        return (
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-5"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--navy)]/10 flex items-center justify-center">
                <Store size={18} className="text-[var(--navy)]" />
              </div>
              <h2 className="text-lg font-bold">{t.settings.store.title}</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeName">{t.settings.store.storeName}</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={t.settings.store.storeNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.settings.store.logoUrl}</Label>
              {/* Upload or URL */}
              <div className="flex gap-2">
                <Input
                  id="logo"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  dir="ltr"
                  className="text-left flex-1"
                />
                <label
                  className="flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors shrink-0"
                  title="رفع صورة من الجهاز"
                  style={{ background: "var(--surface)" }}
                >
                  <Upload size={15} style={{ color: "var(--muted)" }} />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        if (dataUrl) setLogo(dataUrl);
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {logo && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={logo}
                    alt={t.settings.store.logoPreviewAlt}
                    className="h-16 w-16 object-contain rounded-xl border border-[var(--border)]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <button type="button" onClick={() => setLogo("")} className="text-[12px] text-red-400 hover:text-red-300 transition-colors">
                    حذف الشعار
                  </button>
                </div>
              )}
            </div>

            {/* Store contact info for invoice */}
            <div className="space-y-2">
              <Label>رقم الهاتف (للفاتورة)</Label>
              <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="+90 535 000 00 00" dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <Label>انستغرام (للفاتورة)</Label>
              <Input value={storeInstagram} onChange={(e) => setStoreInstagram(e.target.value)} placeholder="@trendy.store.tr" dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <Label>المدينة (للفاتورة)</Label>
              <Input value={storeCity} onChange={(e) => setStoreCity(e.target.value)} placeholder="Istanbul, Türkiye" dir="ltr" className="text-left" />
            </div>
          </div>
        );

      case "financial":
        return (
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-5"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--navy)]/10 flex items-center justify-center">
                <Percent size={18} className="text-[var(--navy)]" />
              </div>
              <h2 className="text-lg font-bold">{t.settings.financial.title}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usdToTry">{t.settings.financial.usdToTry}</Label>
                <Input
                  id="usdToTry"
                  type="number"
                  step="0.01"
                  value={usdToTry}
                  onChange={(e) => setUsdToTry(e.target.value)}
                  placeholder="38.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usdToIqd">{t.settings.financial.usdToIqd}</Label>
                <Input
                  id="usdToIqd"
                  type="number"
                  step="0.01"
                  value={usdToIqd}
                  onChange={(e) => setUsdToIqd(e.target.value)}
                  placeholder="1460.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tryToIqd">{t.settings.financial.tryToIqd}</Label>
                <Input
                  id="tryToIqd"
                  type="number"
                  step="0.01"
                  value={tryToIqd}
                  onChange={(e) => setTryToIqd(e.target.value)}
                  placeholder="38.40"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {t.settings.financial.note}
            </p>
          </div>
        );

      case "invoice": {
        return (
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-5"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--navy)]/10 flex items-center justify-center">
                <FileText size={18} className="text-[var(--navy)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold">قالب الفاتورة</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">عدّل الـ HTML/CSS مباشرة — المتغيرات تُحقن تلقائياً عند الفتح</p>
              </div>
            </div>

            {/* HTML editor */}
            <div className="space-y-2">
              <textarea
                value={invoiceTemplate}
                onChange={(e) => setInvoiceTemplate(e.target.value)}
                rows={20}
                spellCheck={false}
                dir="ltr"
                placeholder="اتركه فارغاً لاستخدام القالب الافتراضي..."
                className="w-full rounded-xl border border-[var(--border)] bg-[#0d1117] text-[#e6edf3] p-4 text-xs font-mono resize-y outline-none focus:border-[var(--accent)]/50 transition-colors"
                style={{ lineHeight: 1.6 }}
              />

              {/* Variables reference */}
              <details className="text-xs">
                <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)] transition-colors select-none">
                  المتغيرات المتاحة ← انقر للعرض
                </summary>
                <div className="mt-2 p-3 bg-[var(--background)] rounded-lg border border-[var(--border)] font-mono text-[11px] text-[var(--muted)] leading-8 break-all" dir="ltr">
                  {`{{STORE_NAME}}  {{STORE_CITY}}  {{STORE_PHONE}}  {{STORE_INSTAGRAM}}\n{{STORE_LOGO_HTML}}  {{QR_CODE_HTML}}\n{{CUSTOMER_NAME}}  {{CUSTOMER_PHONE}}  {{CUSTOMER_CITY}}\n{{INVOICE_NUMBER}}  {{DATE}}\n{{ITEMS_TABLE_ROWS}}\n{{SUBTOTAL}}  {{DELIVERY}}  {{DISCOUNT}}  {{DISCOUNT_PCT}}  {{TOTAL}}`}
                </div>
              </details>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInvoicePreviewMode((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[var(--border)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
              >
                <Eye size={13} />
                {invoicePreviewMode ? "إخفاء المعاينة" : "معاينة"}
              </button>
              <button
                type="button"
                onClick={() => setInvoiceTemplate("")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-red-400 hover:border-red-400/40 transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                إعادة للافتراضي
              </button>
            </div>

            {/* Live preview */}
            {invoicePreviewMode && invoiceTemplate && (
              <div className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ height: 500 }}>
                <iframe
                  srcDoc={invoiceTemplate}
                  className="w-full h-full"
                  sandbox="allow-same-origin"
                  title="invoice preview"
                />
              </div>
            )}

            <p className="text-xs text-[var(--muted)] italic">احفظ التغييرات بعد التعديل لتطبيقها على الفواتير القادمة.</p>
          </div>
        );
      }

      case "system":
        return (
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-5"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--navy)]/10 flex items-center justify-center">
                <Database size={18} className="text-[var(--navy)]" />
              </div>
              <h2 className="text-lg font-bold">{t.settings.system.title}</h2>
            </div>

            {/* ── Language ── */}
            <div className="border border-[var(--border)] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Languages size={16} className="text-[var(--navy)]" />
                <span className="text-sm font-semibold text-[var(--foreground)]">{t.settings.system.language}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocale("ar")}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    locale === "ar"
                      ? "bg-[var(--navy)] text-white border-[var(--navy)]"
                      : "bg-transparent text-[var(--foreground)] border-[var(--border)] hover:border-[var(--navy)]/50"
                  }`}
                >
                  {t.settings.system.languageAr}
                </button>
                <button
                  onClick={() => setLocale("en")}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    locale === "en"
                      ? "bg-[var(--navy)] text-white border-[var(--navy)]"
                      : "bg-transparent text-[var(--foreground)] border-[var(--border)] hover:border-[var(--navy)]/50"
                  }`}
                >
                  {t.settings.system.languageEn}
                </button>
              </div>
            </div>

            {/* ── Action cards ── */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleExportDatabase}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-[var(--border)] transition-colors cursor-pointer text-start hover:border-[var(--accent)]/40 hover:bg-[var(--surface-secondary)]"
              >
                <Download size={16} style={{ color: "var(--muted)" }} />
                <span className="text-sm" style={{ color: "var(--muted)" }}>{t.settings.system.exportDatabase}</span>
              </button>
              <button
                onClick={handleExportMeta}
                disabled={exportingMeta}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-[var(--border)] transition-colors cursor-pointer text-start hover:border-[var(--accent)]/40 hover:bg-[var(--surface-secondary)] disabled:opacity-50"
              >
                <Download size={16} style={{ color: "var(--muted)" }} />
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  {exportingMeta ? t.settings.system.exporting : t.settings.system.exportMeta}
                </span>
              </button>
              <label className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-[var(--border)] transition-colors cursor-pointer hover:border-[var(--accent)]/40 hover:bg-[var(--surface-secondary)]">
                <Upload size={16} style={{ color: "var(--muted)" }} />
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  {importing ? t.settings.system.importing : t.settings.system.importBtn}
                </span>
                <input type="file" accept=".csv,text/csv" className="sr-only" disabled={importing} onChange={handleImportCSV} />
              </label>
            </div>

            {importMsg && (
              <div
                className="text-sm font-medium rounded-xl px-4 py-2.5"
                style={{
                  background: importMsg.ok ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
                  color: importMsg.ok ? "#16a34a" : "#dc2626",
                }}
              >
                {importMsg.text}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }
}
