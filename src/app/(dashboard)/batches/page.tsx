"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Package,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { formatIQD, formatUSD, formatTRY } from "@/lib/utils";
import { format } from "date-fns";

// ---------- Types ----------

interface Order {
  id: string;
  productType: string;
  productName: string | null;
  color: string | null;
  size: string | null;
  purchaseCost: number;
  sellingPrice: number;
  deliveryCost: number;
  deposit: number;
  status: string;
  paymentStatus: string;
  customer: { id: string; name: string };
}

interface Batch {
  id: string;
  name: string;
  openDate: string;
  closeDate: string | null;
  shippingCost: number;
  status: string;
  orders: Order[];
  _count: { orders: number };
}

interface Settings {
  usdToIqd: number;
  tryToIqd: number;
}

interface BatchFormData {
  name: string;
  openDate: string;
  closeDate: string;
  shippingCost: string;
  status: string;
}

const EMPTY_FORM: BatchFormData = {
  name: "",
  openDate: new Date().toISOString().slice(0, 10),
  closeDate: "",
  shippingCost: "0",
  status: "open",
};

const STATUS_OPTIONS = [
  { value: "open", label: "مفتوحة" },
  { value: "shipped", label: "تم الشحن" },
  { value: "in_distribution", label: "قيد التوزيع" },
  { value: "completed", label: "مكتملة" },
];

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: "مفتوحة", className: "bg-blue-500 text-white border-transparent" },
    shipped: { label: "تم الشحن", className: "bg-amber-500 text-white border-transparent" },
    in_distribution: {
      label: "قيد التوزيع",
      className: "bg-purple-500 text-white border-transparent",
    },
    completed: { label: "مكتملة", className: "bg-green-500 text-white border-transparent" },
  };
  const info = map[status] ?? { label: status, className: "" };
  return <Badge className={info.className}>{info.label}</Badge>;
}

// ---------- Component ----------

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [form, setForm] = useState<BatchFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = useAuthStore((s) => s.isAdmin);

  // Fetch batches + settings
  const fetchData = useCallback(async () => {
    try {
      const [batchRes, settingsRes] = await Promise.all([
        fetch("/api/batches"),
        fetch("/api/settings"),
      ]);
      if (batchRes.ok) setBatches(await batchRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (err) {
      console.error("Failed to fetch batches", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- Handlers ----------

  function openCreate() {
    setEditingBatch(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(batch: Batch) {
    setEditingBatch(batch);
    setForm({
      name: batch.name,
      openDate: batch.openDate ? batch.openDate.slice(0, 10) : "",
      closeDate: batch.closeDate ? batch.closeDate.slice(0, 10) : "",
      shippingCost: String(batch.shippingCost),
      status: batch.status,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        openDate: form.openDate || undefined,
        closeDate: form.closeDate || null,
        shippingCost: form.shippingCost,
        status: form.status,
      };

      const url = editingBatch ? `/api/batches/${editingBatch.id}` : "/api/batches";
      const method = editingBatch ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Save batch failed", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه الشحنة؟ سيتم فصل الطلبات المرتبطة بها.")) return;
    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // ---------- Profit calculation ----------

  function calcProfit(batch: Batch) {
    if (!settings) return { revenue: 0, purchaseCosts: 0, shippingCosts: 0, profit: 0 };

    const revenue = batch.orders.reduce((sum, o) => sum + o.sellingPrice, 0);
    const purchaseCosts = batch.orders.reduce(
      (sum, o) => sum + o.purchaseCost * settings.tryToIqd,
      0
    );
    const shippingCosts = batch.shippingCost * settings.usdToIqd;
    const profit = revenue - purchaseCosts - shippingCosts;
    return { revenue, purchaseCosts, shippingCosts, profit };
  }

  function boughtCount(batch: Batch) {
    return batch.orders.filter((o) => o.status !== "new" && o.status !== "cancelled").length;
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الشحنات</h1>
          <p className="text-muted-foreground">إدارة الشحنات وتتبع الطلبات</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="me-2 h-4 w-4" />
          شحنة جديدة
        </Button>
      </div>

      {/* Batches Grid */}
      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد شحنات بعد. أنشئ شحنتك الأولى.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => {
            const { revenue, purchaseCosts, shippingCosts, profit } = calcProfit(batch);
            const bought = boughtCount(batch);
            const total = batch._count.orders;
            const isExpanded = expandedId === batch.id;

            return (
              <Card key={batch.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{batch.name}</CardTitle>
                    {statusBadge(batch.status)}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 text-sm">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">تاريخ الفتح:</span>{" "}
                      {format(new Date(batch.openDate), "MMM d, yyyy")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">تاريخ الإغلاق:</span>{" "}
                      {batch.closeDate
                        ? format(new Date(batch.closeDate), "MMM d, yyyy")
                        : "---"}
                    </div>
                  </div>

                  {/* Shipping + Orders */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">الشحن:</span>{" "}
                      {formatUSD(batch.shippingCost)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">الطلبات:</span> {total}
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>التقدم</span>
                      <span>
                        {bought} تم شراؤها / {total} الإجمالي
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: total > 0 ? `${(bought / total) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>

                  {/* Profit breakdown */}
                  {settings && (
                    <div className="rounded-md border p-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الإيرادات</span>
                        <span>{formatIQD(revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تكاليف الشراء</span>
                        <span>-{formatIQD(purchaseCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تكلفة الشحن</span>
                        <span>-{formatIQD(shippingCosts)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>الربح المتوقع</span>
                        <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatIQD(profit)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Expanded orders table */}
                  {isExpanded && batch.orders.length > 0 && (
                    <div className="rounded-md border overflow-x-auto mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>العميل</TableHead>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead className="text-start">سعر البيع</TableHead>
                            <TableHead className="text-start">سعر الشراء</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {batch.orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                {order.customer.name}
                              </TableCell>
                              <TableCell>
                                {order.productName || order.productType}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-start">
                                {formatIQD(order.sellingPrice)}
                              </TableCell>
                              <TableCell className="text-start">
                                {formatTRY(order.purchaseCost)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {isExpanded && batch.orders.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      لا توجد طلبات في هذه الشحنة.
                    </p>
                  )}
                </CardContent>

                <CardFooter className="gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => toggleExpand(batch.id)}>
                    {isExpanded ? (
                      <ChevronUp className="me-1 h-4 w-4" />
                    ) : (
                      <Eye className="me-1 h-4 w-4" />
                    )}
                    {isExpanded ? "إخفاء الطلبات" : "عرض الطلبات"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(batch)}>
                    <Pencil className="me-1 h-4 w-4" />
                    تعديل
                  </Button>
                  {isAdmin() && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(batch.id)}
                    >
                      <Trash2 className="me-1 h-4 w-4" />
                      حذف
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => setDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>{editingBatch ? "تعديل الشحنة" : "شحنة جديدة"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="batch-name">اسم الشحنة</Label>
              <Input
                id="batch-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="مثال: شحنة #12 - مارس"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-open-date">تاريخ الفتح</Label>
                <Input
                  id="batch-open-date"
                  type="date"
                  value={form.openDate}
                  onChange={(e) => setForm((f) => ({ ...f, openDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-close-date">تاريخ الإغلاق</Label>
                <Input
                  id="batch-close-date"
                  type="date"
                  value={form.closeDate}
                  onChange={(e) => setForm((f) => ({ ...f, closeDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-shipping">تكلفة الشحن (USD)</Label>
              <Input
                id="batch-shipping"
                type="number"
                min="0"
                step="0.01"
                value={form.shippingCost}
                onChange={(e) => setForm((f) => ({ ...f, shippingCost: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-status">الحالة</Label>
              <Select
                id="batch-status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {editingBatch ? "حفظ" : "إنشاء شحنة"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
