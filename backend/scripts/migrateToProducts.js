/**
 * Migration: Introduce Product model
 *
 * Run from the backend/ directory:
 *   node scripts/migrateToProducts.js
 *
 * What it does:
 *  1. Creates a Product document for each unique item name in inventories
 *  2. Updates every inventory document to reference the matching Product
 *  3. Updates every sale document to reference the matching Product
 *  4. Updates every pullout document to reference the matching Product
 */

require("dotenv").config();
const mongoose = require("mongoose");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const inventories = db.collection("inventories");
  const sales = db.collection("sales");
  const pullouts = db.collection("pullouts");
  const products = db.collection("products");

  // Step 1: Get all unique names from existing inventory documents
  const uniqueNames = await inventories.distinct("name");
  const validNames = uniqueNames.filter(Boolean);
  console.log(`Found ${validNames.length} unique product names:`, validNames);

  // Step 2: Create a Product for each unique name (skip if already exists)
  const nameToProductId = {};
  for (const name of validNames) {
    const existing = await products.findOne({ name });
    if (existing) {
      nameToProductId[name] = existing._id;
      console.log(`Product already exists: '${name}'`);
    } else {
      const result = await products.insertOne({
        name,
        unit: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      nameToProductId[name] = result.insertedId;
      console.log(`Created product: '${name}' → ${result.insertedId}`);
    }
  }

  // Step 3: Update inventory documents — set product field from name
  let inventoryUpdated = 0;
  for (const [name, productId] of Object.entries(nameToProductId)) {
    const result = await inventories.updateMany(
      { name, product: { $exists: false } },
      { $set: { product: productId } }
    );
    inventoryUpdated += result.modifiedCount;
  }
  console.log(`Updated ${inventoryUpdated} inventory documents`);

  // Step 4: Build inventoryId → productId map
  const allInventories = await inventories.find({}).toArray();
  const inventoryProductMap = {};
  for (const inv of allInventories) {
    if (inv.product) {
      inventoryProductMap[inv._id.toString()] = inv.product;
    }
  }

  // Step 5: Update sales — set product from inventoryItemId lookup, then name fallback
  let salesUpdated = 0;
  const allSales = await sales.find({ product: { $exists: false } }).toArray();
  for (const sale of allSales) {
    let productId = null;
    if (sale.inventoryItemId) {
      productId = inventoryProductMap[sale.inventoryItemId.toString()];
    }
    if (!productId && sale.itemName) {
      productId = nameToProductId[sale.itemName];
    }
    if (productId) {
      await sales.updateOne({ _id: sale._id }, { $set: { product: productId } });
      salesUpdated++;
    }
  }
  console.log(`Updated ${salesUpdated} sale documents`);

  // Step 6: Update pullouts — set product from inventoryItemId lookup
  let pulloutsUpdated = 0;
  const allPullOuts = await pullouts.find({ product: { $exists: false } }).toArray();
  for (const pullOut of allPullOuts) {
    let productId = null;
    if (pullOut.inventoryItemId) {
      productId = inventoryProductMap[pullOut.inventoryItemId.toString()];
    }
    if (!productId && pullOut.itemName) {
      productId = nameToProductId[pullOut.itemName];
    }
    if (productId) {
      await pullouts.updateOne({ _id: pullOut._id }, { $set: { product: productId } });
      pulloutsUpdated++;
    }
  }
  console.log(`Updated ${pulloutsUpdated} pullout documents`);

  console.log("\nMigration complete!");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
