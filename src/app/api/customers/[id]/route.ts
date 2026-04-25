import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      orders: { include: { batch: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { orders: true } },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ltv = customer.orders.reduce((sum, o) => sum + o.sellingPrice, 0);
  return NextResponse.json({
    ...customer,
    isVIP: customer._count.orders >= 3,
    ltv,
    totalOrders: customer._count.orders,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const data = await req.json();
    const customer = await db.customer.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.instagram !== undefined && { instagram: data.instagram }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.phone2 !== undefined && { phone2: data.phone2 }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.area !== undefined && { area: data.area }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  try {
    // Check if customer has orders
    const orderCount = await db.order.count({ where: { customerId: id } });
    if (orderCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer with existing orders" },
        { status: 400 }
      );
    }
    await db.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
