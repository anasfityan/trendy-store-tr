import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const ARABIC_MONTHS = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
];

function monthName(year: number, month: number) {
  return `${ARABIC_MONTHS[month - 1]} ${year}`;
}

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all orders without a batch
  const orders = await db.order.findMany({
    where: { batchId: null },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (orders.length === 0) {
    // Also fix any "closed" batches left from old script runs
    await db.batch.updateMany({
      where: { status: "closed" },
      data: { status: "completed" },
    });
    return NextResponse.json({ created: 0, assigned: 0, message: "لا توجد طلبات غير مصنّفة" });
  }

  // Group by year+month
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

  let created = 0;
  let assigned = 0;

  for (const [, { year, month, ids }] of sorted) {
    const name = monthName(year, month);
    const openDate  = new Date(year, month - 1, 1);
    const closeDate = new Date(year, month, 0, 23, 59, 59);

    let batch = await db.batch.findFirst({ where: { name } });
    if (!batch) {
      batch = await db.batch.create({
        data: { name, openDate, closeDate, status: "completed" },
      });
      created++;
    } else if (batch.status === "closed") {
      await db.batch.update({ where: { id: batch.id }, data: { status: "completed" } });
    }

    await db.order.updateMany({
      where: { id: { in: ids } },
      data: { batchId: batch.id },
    });

    assigned += ids.length;
  }

  // Fix any remaining "closed" batches
  await db.batch.updateMany({
    where: { status: "closed" },
    data: { status: "completed" },
  });

  return NextResponse.json({ created, assigned });
}
