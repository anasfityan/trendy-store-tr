import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const content = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").trim(); });
    return row;
  }).filter((r) => Object.values(r).some((v) => v));
  return { headers, rows };
}

function extractCSVFromZip(buffer: Buffer): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries().filter(
    (e: { isDirectory: boolean; entryName: string }) =>
      !e.isDirectory && e.entryName.toLowerCase().endsWith(".csv")
  );
  if (entries.length === 0) throw new Error("no_csv");
  const preferred =
    entries.find((e: { entryName: string }) =>
      /customer|عميل|زبون|client/i.test(e.entryName)
    ) ?? entries[0];
  return preferred.getData().toString("utf-8");
}

function parseNum(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[,،\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseDate(v: string | undefined): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try { formData = await req.formData(); }
  catch (e) {
    console.error("formData parse error:", e);
    return NextResponse.json({ error: "تعذّر قراءة الملف" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const action = (formData.get("action") as string) ?? "parse";
  if (!file) return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });

  const name = file.name.toLowerCase();
  let csvContent = "";

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (name.endsWith(".csv")) {
      csvContent = buffer.toString("utf-8");
    } else if (name.endsWith(".zip")) {
      csvContent = extractCSVFromZip(buffer);
    } else {
      return NextResponse.json({ error: "الملف غير مدعوم — ارفع ملف ZIP أو CSV" }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "no_csv") return NextResponse.json({ error: "لا يوجد ملف CSV داخل الـ ZIP" }, { status: 400 });
    console.error("file read error:", e);
    return NextResponse.json({ error: "فشل فتح الملف" }, { status: 400 });
  }

  const { headers, rows } = parseCSV(csvContent);
  if (headers.length === 0) return NextResponse.json({ error: "الملف فارغ أو تعذّرت قراءته" }, { status: 400 });

  if (action === "parse") {
    return NextResponse.json({ headers, preview: rows.slice(0, 8), total: rows.length });
  }

  // action === "import"
  let mapping: Record<string, string> = {};
  try { mapping = JSON.parse((formData.get("mapping") as string) ?? "{}"); }
  catch { return NextResponse.json({ error: "بيانات الربط غير صحيحة" }, { status: 400 }); }

  if (!mapping.name) return NextResponse.json({ error: "يجب تحديد عمود الاسم" }, { status: 400 });

  const g = (col: string, row: Record<string, string>) =>
    mapping[col] ? (row[mapping[col]]?.trim() || null) : null;

  const hasOrderFields = !!(mapping.productName || mapping.productLink ||
    mapping.purchaseCost || mapping.sellingPrice || mapping.size || mapping.productType);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const customerName = row[mapping.name]?.trim();
    if (!customerName) { skipped++; continue; }
    try {
      const orderDate = parseDate(g("orderDate", row) ?? undefined);
      const customer = await db.customer.create({
        data: {
          name:      customerName,
          instagram: g("instagram", row),
          phone:     g("phone", row),
          phone2:    g("phone2", row),
          city:      g("city", row),
          area:      g("area", row),
          notes:     g("notes", row),
          ...(orderDate ? { createdAt: orderDate } : {}),
        },
      });

      if (hasOrderFields) {
        const productType = g("productType", row) || "Other";
        const purchaseCost = parseNum(g("purchaseCost", row) ?? undefined);
        const sellingPrice = parseNum(g("sellingPrice", row) ?? undefined);
        await db.order.create({
          data: {
            customerId:   customer.id,
            productType,
            productName:  g("productName", row),
            productLink:  g("productLink", row),
            size:         g("size", row),
            purchaseCost,
            sellingPrice,
            status:       "delivered",
            paymentStatus: "paid",
            ...(orderDate ? { createdAt: orderDate } : {}),
          },
        });
      }

      created++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ created, skipped });
}
