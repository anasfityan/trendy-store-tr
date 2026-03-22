import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    totalOrders,
    pendingOrders,
    allOrders,
    openBatch,
    recentOrders,
    unpaidDelivered,
    settings,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: { in: ["new", "in_progress"] } } }),
    db.order.findMany({ select: { sellingPrice: true, deposit: true, paymentStatus: true } }),
    db.batch.findFirst({
      where: { status: "open" },
      include: {
        orders: true,
        _count: { select: { orders: true } },
      },
    }),
    db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { customer: true, batch: true },
    }),
    db.order.findMany({
      where: { status: "delivered", paymentStatus: { not: "paid" } },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
    db.settings.findUnique({ where: { id: "default" } }),
  ]);

  const totalRevenue = allOrders.reduce((sum, o) => sum + o.sellingPrice, 0);
  const outstandingDebts = allOrders
    .filter((o) => o.paymentStatus !== "paid")
    .reduce((sum, o) => sum + (o.sellingPrice - o.deposit), 0);

  const boughtInBatch = openBatch
    ? openBatch.orders.filter((o) => o.status !== "new" && o.status !== "cancelled").length
    : 0;

  return NextResponse.json({
    stats: {
      totalOrders,
      pendingOrders,
      totalRevenue,
      outstandingDebts,
    },
    openBatch: openBatch
      ? {
          ...openBatch,
          boughtCount: boughtInBatch,
          totalCount: openBatch._count.orders,
        }
      : null,
    recentOrders,
    unpaidDelivered,
    settings,
  });
}
