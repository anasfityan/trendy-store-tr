import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const batch = await db.batch.findUnique({
    where: { id },
    include: {
      orders: { include: { customer: true } },
      _count: { select: { orders: true } },
    },
  });

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(batch);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const data = await req.json();
    const batch = await db.batch.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.closeDate !== undefined && { closeDate: data.closeDate ? new Date(data.closeDate) : null }),
        ...(data.shippingCost !== undefined && { shippingCost: parseFloat(data.shippingCost) || 0 }),
        ...(data.status && { status: data.status }),
      },
      include: {
        orders: { include: { customer: true } },
        _count: { select: { orders: true } },
      },
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Update batch error:", error);
    return NextResponse.json({ error: "Failed to update batch" }, { status: 500 });
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
    // Unlink orders from this batch first
    await db.order.updateMany({
      where: { batchId: id },
      data: { batchId: null },
    });
    await db.batch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
  }
}
