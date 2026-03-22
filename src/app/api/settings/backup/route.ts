import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const [users, customers, orders, batches, settings] = await Promise.all([
      prisma.user.findMany(),
      prisma.customer.findMany(),
      prisma.order.findMany(),
      prisma.batch.findMany(),
      prisma.settings.findMany(),
    ]);

    const backup = { users, customers, orders, batches, settings, exportedAt: new Date().toISOString() };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="trendy-store-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}
