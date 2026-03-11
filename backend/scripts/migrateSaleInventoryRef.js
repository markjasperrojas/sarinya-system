/**
 * Migration: Set inventoryItemId on existing Sale records
 * Run once: node backend/scripts/migrateSaleInventoryRef.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const sales = await Sale.find({ inventoryItemId: { $exists: false } });
  console.log(`Found ${sales.length} sales without inventoryItemId`);

  const inventoryItems = await Inventory.find({}, "_id name");
  const nameToId = {};
  for (const item of inventoryItems) {
    nameToId[item.name] = item._id;
  }

  let updated = 0;
  let skipped = 0;

  for (const sale of sales) {
    const itemId = nameToId[sale.itemName];
    if (itemId) {
      await Sale.updateOne({ _id: sale._id }, { $set: { inventoryItemId: itemId } });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Done. Updated: ${updated}, Skipped (no matching inventory): ${skipped}`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
