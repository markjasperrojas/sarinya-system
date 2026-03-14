/**
 * Migration: Create an active inventory batch (stock=10, expiry=+2 weeks) for every product.
 * Skips products that already have an active inventory entry.
 * Run: node backend/scripts/seedStockForAllProducts.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 14);

  const products = await Product.find({ deletedAt: null });
  console.log(`Found ${products.length} active products`);

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await Inventory.findOne({
      product: product._id,
      status: "active",
      deletedAt: null,
    });

    if (existing) {
      console.log(`  SKIP  ${product.name} (already has active stock)`);
      skipped++;
      continue;
    }

    await Inventory.create({
      product: product._id,
      quantity: 10,
      expirationDate,
      status: "active",
    });

    console.log(`  ADDED ${product.name}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
