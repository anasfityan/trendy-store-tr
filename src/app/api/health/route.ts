import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const info: Record<string, unknown> = {
    DATABASE_URL: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":***@")
      : "NOT SET",
    DIRECT_URL: process.env.DIRECT_URL
      ? process.env.DIRECT_URL.replace(/:([^:@]+)@/, ":***@")
      : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    await db.$queryRaw`SELECT 1`;
    info.db = "connected";
    const userCount = await db.user.count();
    info.users = userCount;
  } catch (err) {
    info.db = "error";
    info.dbError = String(err);
  }

  return NextResponse.json(info);
}
