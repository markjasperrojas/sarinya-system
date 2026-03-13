/**
 * Migration: Add soft-delete support
 *
 * 1. Backfills `deletedAt: null` on all existing documents in
 *    products, inventories, sales, and users collections.
 * 2. Drops the old hard-unique index on `products.name` (which would
 *    otherwise prevent re-creating a product with the same name as a
 *    soft-deleted one). Uniqueness is now enforced at the app level.
 * 3. Drops the old hard-unique index on `users.username` for the same reason.
 *
 * Run: node backend/scripts/addSoftDelete.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const DB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/sarinya";

async function migrate() {
  await mongoose.connect(DB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;

  // ── 1. Backfill deletedAt: null ──────────────────────────────────────────
  const collections = ["products", "inventories", "sales", "users"];
  for (const col of collections) {
    const result = await db
      .collection(col)
      .updateMany({ deletedAt: { $exists: false } }, { $set: { deletedAt: null } });
    console.log(`[${col}] backfilled deletedAt on ${result.modifiedCount} document(s)`);
  }

  // ── 2. Drop old unique index on products.name ────────────────────────────
  try {
    // The index may have been created with or without collation; list first.
    const productIndexes = await db.collection("products").indexes();
    const nameIndex = productIndexes.find(
      (idx) => idx.key && idx.key.name !== undefined && idx.unique === true
    );
    if (nameIndex) {
      await db.collection("products").dropIndex(nameIndex.name);
      console.log(`[products] dropped unique index '${nameIndex.name}' on name`);
    } else {
      console.log("[products] no unique index on name found – skipping");
    }
  } catch (err) {
    console.warn("[products] could not drop name index:", err.message);
  }

  // ── 3. Drop old unique index on users.username ───────────────────────────
  try {
    const userIndexes = await db.collection("users").indexes();
    const usernameIndex = userIndexes.find(
      (idx) => idx.key && idx.key.username !== undefined && idx.unique === true
    );
    if (usernameIndex) {
      await db.collection("users").dropIndex(usernameIndex.name);
      console.log(`[users] dropped unique index '${usernameIndex.name}' on username`);
    } else {
      console.log("[users] no unique index on username found – skipping");
    }
  } catch (err) {
    console.warn("[users] could not drop username index:", err.message);
  }

  console.log("\nMigration complete.");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
