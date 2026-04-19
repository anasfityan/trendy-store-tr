import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: "أحمد محمد", instagram: "ahmed_m", phone: "07701234567", city: "بغداد", area: "الكرادة" } }),
    prisma.customer.create({ data: { name: "فاطمة علي", instagram: "fatima.ali", phone: "07709876543", city: "البصرة", area: "العشار" } }),
    prisma.customer.create({ data: { name: "زينب حسين", instagram: "zainab.h", phone: "07705551234", city: "أربيل", area: "عينكاوة" } }),
    prisma.customer.create({ data: { name: "محمد كريم", instagram: "mk_shop", phone: "07708887766", city: "النجف", area: "المركز" } }),
    prisma.customer.create({ data: { name: "نور الهدى", instagram: "noor.huda", phone: "07703334455", city: "كربلاء", area: "المركز" } }),
  ]);
  console.log(`✓ Created ${customers.length} customers`);

  // Create batches
  const batch1 = await prisma.batch.create({
    data: { name: "شحنة مارس 2026", openDate: new Date("2026-03-01"), shippingCost: 150, status: "open" },
  });
  const batch2 = await prisma.batch.create({
    data: { name: "شحنة فبراير 2026", openDate: new Date("2026-02-01"), closeDate: new Date("2026-02-28"), shippingCost: 120, status: "completed" },
  });
  console.log(`✓ Created 2 batches`);

  // Create orders
  const orders = await Promise.all([
    prisma.order.create({ data: {
      customerId: customers[0].id, batchId: batch1.id,
      productType: "Bag", productName: "حقيبة يد جلدية", color: "أسود", size: "M",
      productLink: "https://www.trendyol.com/example1",
      governorate: "بغداد", area: "الكرادة", phone: "07701234567",
      purchaseCost: 350, sellingPrice: 45000, deliveryCost: 5000, deposit: 20000,
      status: "bought", paymentStatus: "partial",
    }}),
    prisma.order.create({ data: {
      customerId: customers[1].id, batchId: batch1.id,
      productType: "Shoe", productName: "حذاء رياضي نايك", color: "أبيض", size: "42",
      governorate: "البصرة", area: "العشار", phone: "07709876543",
      purchaseCost: 500, sellingPrice: 65000, deliveryCost: 6000, deposit: 30000,
      status: "new", paymentStatus: "unpaid",
    }}),
    prisma.order.create({ data: {
      customerId: customers[2].id, batchId: batch1.id,
      productType: "Clothing", productName: "فستان صيفي", color: "أحمر", size: "S",
      governorate: "أربيل", area: "عينكاوة", phone: "07705551234",
      purchaseCost: 200, sellingPrice: 35000, deliveryCost: 5000, deposit: 35000,
      status: "delivered", paymentStatus: "paid",
    }}),
    prisma.order.create({ data: {
      customerId: customers[3].id, batchId: batch2.id,
      productType: "Bag", productName: "شنطة ظهر", color: "بني", size: "L",
      governorate: "النجف", area: "المركز", phone: "07708887766",
      purchaseCost: 280, sellingPrice: 40000, deliveryCost: 5000, deposit: 0,
      status: "delivered", paymentStatus: "unpaid",
    }}),
    prisma.order.create({ data: {
      customerId: customers[4].id, batchId: batch2.id,
      productType: "Accessory", productName: "ساعة يد كلاسيكية", color: "ذهبي",
      governorate: "كربلاء", area: "المركز", phone: "07703334455",
      purchaseCost: 600, sellingPrice: 85000, deliveryCost: 6000, deposit: 50000,
      status: "shipped", paymentStatus: "partial",
    }}),
    prisma.order.create({ data: {
      customerId: customers[0].id, batchId: batch1.id,
      productType: "Clothing", productName: "جاكيت شتوي", color: "كحلي", size: "XL",
      governorate: "بغداد", area: "المنصور", phone: "07701234567",
      purchaseCost: 450, sellingPrice: 55000, deliveryCost: 5000, deposit: 25000,
      status: "in_progress", paymentStatus: "partial",
    }}),
    prisma.order.create({ data: {
      customerId: customers[1].id,
      productType: "Shoe", productName: "صندل نسائي", color: "بيج", size: "38",
      governorate: "البصرة", area: "الجبيلة", phone: "07709876543",
      purchaseCost: 150, sellingPrice: 25000, deliveryCost: 5000, deposit: 0,
      status: "new", paymentStatus: "unpaid",
    }}),
    prisma.order.create({ data: {
      customerId: customers[2].id, batchId: batch1.id,
      productType: "Bag", productName: "حقيبة كتف", color: "وردي",
      governorate: "أربيل", area: "المركز", phone: "07705551234",
      purchaseCost: 320, sellingPrice: 42000, deliveryCost: 6000, deposit: 42000,
      status: "delivered", paymentStatus: "paid",
    }}),
  ]);
  console.log(`✓ Created ${orders.length} orders`);

  // Verify counts
  const counts = {
    customers: await prisma.customer.count(),
    orders: await prisma.order.count(),
    batches: await prisma.batch.count(),
    settings: await prisma.settings.count(),
    users: await prisma.user.count(),
  };
  console.log("\n📊 Database summary:", counts);
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
