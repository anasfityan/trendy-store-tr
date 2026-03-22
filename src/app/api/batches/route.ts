import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const batches = await db.batch.findMany({
    include: {
      orders: {
        include: { customer: true },
      },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const batch = await db.batch.create({
      data: {
        name: data.name,
        openDate: data.openDate ? new Date(data.openDate) : new Date(),
        shippingCost: parseFloat(data.shippingCost) || 0,
        status: data.status || "open",
      },
      include: { _count: { select: { orders: true } } },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("Create batch error:", error);
    return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
  }
}
