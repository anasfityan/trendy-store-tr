/**
 * Group existing orders into monthly batches.
 *
 * Dry-run:  npx tsx scripts/group-orders-into-batches.ts
 * Execute:  npx tsx scripts/group-orders-into-batches.ts --execute
 *
 * If you already ran this before (with wrong status), use --fix-status
 * to update any existing batches from "closed" → "completed":
 *   npx tsx scripts/group-orders-into-batches.ts --fix-status
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const db = new PrismaClient();
const EXECUTE    = process.argv.includes("--execute");
const FIX_STATUS = process.argv.includes("--fix-status");

const ARABIC_MONTHS = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
];

function monthName(year: number, month: number): string {
  return `${ARABIC_MONTHS[month - 1]} ${year}`;
}

async function main() {

  /* ── Diagnostic: show current state ── */
  const allBatches = await db.batch.findMany({ select: { id: true, name: true, status: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "asc" } });
  const totalOrders    = await db.order.count();
  const withBatch      = await db.order.count({ where: { batchId: { not: null } } });
  const withoutBatch   = totalOrders - withBatch;

  console.log("\n════════ الحالة الحالية ════════");
  console.log(`إجمالي الطلبات      : ${totalOrders}`);
  console.log(`طلبات لها شحنة      : ${withBatch}`);
  console.log(`طلبات بدون شحنة     : ${withoutBatch}`);
  console.log(`إجمالي الشحنات الآن : ${allBatches.length}`);

  if (allBatches.length > 0) {
    console.log("\nالشحنات الموجودة:");
    for (const b of allBatches) {
      console.log(`  [${b.status}]  "${b.name}"  — ${b._count.orders} طلب`);
    }
  }

  /* ── --fix-status: update "closed" → "completed" ── */
  if (FIX_STATUS) {
    const closed = allBatches.filter((b) => b.status === "closed");
    if (closed.length === 0) {
      console.log('\nلا توجد شحنات بحالة "closed" لإصلاحها.');
    } else {
      console.log(`\nتحديث ${closed.length} شحنة من "closed" إلى "completed"...`);
      for (const b of closed) {
        await db.batch.update({ where: { id: b.id }, data: { status: "completed" } });
        console.log(`  ✓  "${b.name}"`);
      }
      console.log("تم الإصلاح.");
    }
    return;
  }

  /* ── Group unbatched orders ── */
  if (withoutBatch === 0) {
    console.log("\nجميع الطلبات لها شحنة بالفعل.");
    console.log("إذا كانت الشحنات لا تظهر بسبب حالة خاطئة، شغّل:");
    console.log("  npx tsx scripts/group-orders-into-batches.ts --fix-status");
    return;
  }

  const orders = await db.order.findMany({
    where: { batchId: null },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, { year: number; month: number; ids: string[] }>();
  for (const order of orders) {
    const d = new Date(order.createdAt);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, { year, month, ids: [] });
    groups.get(key)!.ids.push(order.id);
  }

  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));

  console.log(`\nسيتم إنشاء ${sorted.length} شحنة شهرية:`);
  for (const [key, { year, month, ids }] of sorted) {
    console.log(`  ${key}  →  "${monthName(year, month)}"  (${ids.length} طلب)`);
  }

  if (!EXECUTE) {
    console.log("\nهذا عرض فقط. لا شيء تغيّر.");
    console.log("للتنفيذ: npx tsx scripts/group-orders-into-batches.ts --execute");
    return;
  }

  for (const [, { year, month, ids }] of sorted) {
    const name = monthName(year, month);
    const openDate  = new Date(year, month - 1, 1);
    const closeDate = new Date(year, month, 0, 23, 59, 59);

    let batch = await db.batch.findFirst({ where: { name } });
    if (!batch) {
      batch = await db.batch.create({
        data: { name, openDate, closeDate, status: "completed" },
      });
    } else if (batch.status === "closed") {
      await db.batch.update({ where: { id: batch.id }, data: { status: "completed" } });
    }

    await db.order.updateMany({
      where: { id: { in: ids } },
      data: { batchId: batch.id },
    });

    console.log(`  ✓  "${name}" — ${ids.length} طلب`);
  }

  console.log("\nتم. جميع الطلبات وُزِّعت على شحناتها الشهرية.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
