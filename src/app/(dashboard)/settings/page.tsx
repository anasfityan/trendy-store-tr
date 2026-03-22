"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Settings as SettingsIcon,
  Save,
  Download,
  RefreshCw,
  Database,
} from "lucide-react";

interface SettingsData {
  id: string;
  storeName: string;
  logo: string | null;
  usdToTry: number;
  usdToIqd: number;
  tryToIqd: number;
}

export default function SettingsPage() {
  const { isAdmin } = useAuthStore();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [storeName, setStoreName] = useState("");
  const [logo, setLogo] = useState("");
  const [usdToTry, setUsdToTry] = useState("");
  const [usdToIqd, setUsdToIqd] = useState("");
  const [tryToIqd, setTryToIqd] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data: SettingsData = await res.json();
          setSettings(data);
          setStoreName(data.storeName || "");
          setLogo(data.logo || "");
          setUsdToTry(String(data.usdToTry));
          setUsdToIqd(String(data.usdToIqd));
          setTryToIqd(String(data.tryToIqd));
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
        <p className="text-muted-foreground">صلاحية المسؤول مطلوبة.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">جاري التحميل...</p>
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
          usdToTry: parseFloat(usdToTry),
          usdToIqd: parseFloat(usdToIqd),
          tryToIqd: parseFloat(tryToIqd),
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
        a.download = `trendy-store-backup-${new Date().toISOString().split("T")[0]}.db`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export database error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            الإعدادات
          </h1>
          <p className="text-muted-foreground text-sm">
            إدارة إعدادات المتجر وأسعار الصرف
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 me-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : saved ? (
            <>
              <Save className="h-4 w-4 me-2" />
              تم الحفظ!
            </>
          ) : (
            <>
              <Save className="h-4 w-4 me-2" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات المتجر</CardTitle>
          <CardDescription>المعلومات الأساسية للمتجر</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">اسم المتجر</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Trendy Store"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">رابط الشعار</Label>
            <Input
              id="logo"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            {logo && (
              <div className="mt-2">
                <img
                  src={logo}
                  alt="معاينة شعار المتجر"
                  className="h-16 w-16 object-contain rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <CardHeader>
          <CardTitle>أسعار الصرف</CardTitle>
          <CardDescription>
            أسعار تحويل العملات المستخدمة في حساب التكاليف
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usdToTry">١ دولار = X ليرة تركية</Label>
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
              <Label htmlFor="usdToIqd">١ دولار = X دينار عراقي</Label>
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
              <Label htmlFor="tryToIqd">١ ليرة = X دينار عراقي</Label>
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
          <p className="text-xs text-muted-foreground">
            تُستخدم هذه الأسعار لتحويل تكاليف المنتجات بالليرة التركية وتكاليف الشحن بالدولار إلى الدينار العراقي في التقارير المالية.
          </p>
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            إدارة قاعدة البيانات
          </CardTitle>
          <CardDescription>
            تصدير وإدارة قاعدة بيانات المتجر
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleExportDatabase}>
            <Download className="h-4 w-4 me-2" />
            تصدير قاعدة البيانات
          </Button>
          <p className="text-sm text-muted-foreground">
            يتم تنزيل نسخة احتياطية من ملف قاعدة البيانات. احفظ هذه النسخة في مكان آمن. تحتوي قاعدة البيانات على جميع الطلبات والعملاء والدفعات والإعدادات.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
