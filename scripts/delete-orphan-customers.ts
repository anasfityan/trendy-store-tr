/**
 * Delete customers with zero orders.
 *
 * Dry-run (default):  npx tsx scripts/delete-orphan-customers.ts
 * Execute:            npx tsx scripts/delete-orphan-customers.ts --execute
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const db = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");

async function main() {
  const orphans = await db.customer.findMany({
    where: { orders: { none: {} } },
    select: { id: true, name: true, instagram: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Customers with zero orders: ${orphans.length}`);

  if (!EXECUTE) {
    console.log("\nThis was a DRY RUN. Nothing was changed.");
    console.log("To apply: npx tsx scripts/delete-orphan-customers.ts --execute");
    return;
  }

  const result = await db.customer.deleteMany({
    where: { orders: { none: {} } },
  });

  console.log(`\nDeleted ${result.count} customers with zero orders.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
