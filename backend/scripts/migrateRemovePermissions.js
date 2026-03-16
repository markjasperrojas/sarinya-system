/**
 * One-time migration: remove the `permissions` field from all user documents.
 * Run once after deploying the role-based access refactor.
 *
 * Usage: node backend/scripts/migrateRemovePermissions.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const result = await mongoose.connection
    .collection("users")
    .updateMany({}, { $unset: { permissions: "" } });

  console.log(`Migration complete. Modified ${result.modifiedCount} document(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
