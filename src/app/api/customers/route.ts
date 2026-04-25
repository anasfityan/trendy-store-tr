import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const customers = await db.customer.findMany({
    include: {
      orders: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich with VIP status and LTV
  const enriched = customers.map((c) => {
    const totalOrders = c._count.orders;
    const ltv = c.orders.reduce((sum, o) => sum + o.sellingPrice, 0);
    return {
      ...c,
      isVIP: totalOrders >= 3,
      ltv,
      totalOrders,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const customer = await db.customer.create({
      data: {
        name: data.name,
        instagram: data.instagram,
        phone: data.phone,
        phone2: data.phone2,
        city: data.city,
        area: data.area,
        notes: data.notes,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
