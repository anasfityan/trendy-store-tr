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
  const order = await db.order.findUnique({
    where: { id },
    include: { customer: true, batch: true },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
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
    const order = await db.order.update({
      where: { id },
      data: {
        ...(data.batchId !== undefined && { batchId: data.batchId || null }),
        ...(data.productType && { productType: data.productType }),
        ...(data.productName !== undefined && { productName: data.productName }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.size !== undefined && { size: data.size }),
        ...(data.instagramLink !== undefined && { instagramLink: data.instagramLink }),
        ...(data.productLink !== undefined && { productLink: data.productLink }),
        ...(data.governorate !== undefined && { governorate: data.governorate }),
        ...(data.area !== undefined && { area: data.area }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.purchaseCost !== undefined && { purchaseCost: parseFloat(data.purchaseCost) || 0 }),
        ...(data.sellingPrice !== undefined && { sellingPrice: parseFloat(data.sellingPrice) || 0 }),
        ...(data.deliveryCost !== undefined && { deliveryCost: parseFloat(data.deliveryCost) || 0 }),
        ...(data.deposit !== undefined && { deposit: parseFloat(data.deposit) || 0 }),
        ...(data.status && { status: data.status }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.images !== undefined && { images: data.images }),
        ...(data.items !== undefined && { items: data.items }),
      },
      include: { customer: true, batch: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
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
    await db.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
