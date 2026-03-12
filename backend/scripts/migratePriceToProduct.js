/**
 * Migration: Move price from Inventory batches → Product
 *
 * For each product, finds its most recently-updated inventory batch and uses
 * that price as the product's canonical price. Then removes price from all
 * inventory documents.
 *
 * Run: node backend/scripts/migratePriceToProduct.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const DB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/sarinya";

async function migrate() {
  await mongoose.connect(DB_URI);
  console.log("Connected to MongoDB");

  const Product = mongoose.model(
    "Product",
    new mongoose.Schema({ name: String, price: Number, unit: String }, { strict: false })
  );
  const Inventory = mongoose.model(
    "Inventory",
    new mongoose.Schema({ product: mongoose.Schema.Types.ObjectId, price: Number, quantity: Number }, { strict: false })
  );

  const products = await Product.find({});
  console.log(`Found ${products.length} products\n`);

  let migrated = 0;
  let skipped = 0;
  const conflicts = [];

  for (const product of products) {
    const batches = await Inventory.find({ product: product._id }).sort({ updatedAt: -1 });

    if (batches.length === 0) {
      console.log(`⚠️  ${product.name}: no inventory batches found — skipping (price stays unchanged)`);
      skipped++;
      continue;
    }

    const prices = [...new Set(batches.map((b) => b.price).filter((p) => p !== undefined && p !== null))];

    if (prices.length > 1) {
      conflicts.push({ name: product.name, prices, chosenPrice: batches[0].price });
      console.log(`⚠️  ${product.name}: multiple prices found ${JSON.stringify(prices)} — using most recent: ₱${batches[0].price}`);
    }

    const chosenPrice = batches[0].price ?? 0;
    await Product.findByIdAndUpdate(product._id, { $set: { price: chosenPrice }, $unset: { unit: "" } });
    migrated++;
    console.log(`✅  ${product.name}: price set to ₱${chosenPrice}`);
  }

  // Remove price field from all inventory documents
  const result = await Inventory.updateMany({}, { $unset: { price: "" } });
  console.log(`\nRemoved 'price' field from ${result.modifiedCount} inventory documents`);

  console.log(`\n--- Summary ---`);
  console.log(`Products migrated: ${migrated}`);
  console.log(`Products skipped: ${skipped}`);
  if (conflicts.length > 0) {
    console.log(`\nProducts with conflicting prices (review manually):`);
    conflicts.forEach((c) => console.log(`  - ${c.name}: had prices ${JSON.stringify(c.prices)}, set to ₱${c.chosenPrice}`));
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
