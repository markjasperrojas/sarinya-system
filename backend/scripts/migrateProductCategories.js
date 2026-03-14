/**
 * Migration: Assign categories to existing products based on their names.
 * Safe to re-run — uses $addToSet so it won't duplicate entries.
 * Run: node backend/scripts/migrateProductCategories.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("../models/Product");

// Each entry: { patterns: [regex strings], category: "enum_value" }
// Products are matched case-insensitively against any of the patterns.
const CATEGORY_RULES = [
  // Silog — anything with "silog" in the name
  {
    category: "silog",
    patterns: ["silog"],
  },
  // Platters
  {
    category: "platters",
    patterns: [
      "pancit",
      "beef steak",
      "sizzling sisig",
      "pork humba",
      "chicken inasal",
    ],
  },
  // Soup
  {
    category: "soup",
    patterns: [
      "pork sinigang",
      "seafood sinigang",
      "chicken tinola",
      "beef bulalo",
    ],
  },
  // Grilled
  {
    category: "grilled",
    patterns: [
      "grilled liempo",
      "grilled bangus",
    ],
  },
  // Snack & Drinks
  {
    category: "snacks_and_drinks",
    patterns: [
      "burger with fries",
      "clubhouse",
      "^fries$",        // exact "fries" to avoid false matches
    ],
  },
  // Drinks (Pitcher)
  {
    category: "drinks_pitcher",
    patterns: [
      "sweet lemonade",
      "fresh calamansi",
      "fresh calamanse",
      // "Cucumber" pitcher — matched only when it's NOT a shake
      // We match it broadly and let the shake rule also match cucumber shakes
      // so cucumber shake gets both; standalone cucumber pitcher only gets drinks_pitcher
      "^cucumber$",
    ],
  },
  // Fresh Shakes
  {
    category: "fresh_shakes",
    patterns: [
      "watermelon shake",
      "water melon shake",
      "cucumber shake",
      "pineapple shake",
      "mango shake",
      "mango graham shake",
    ],
  },
];

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected to MongoDB\n");

  let totalUpdated = 0;

  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      const regex = new RegExp(pattern, "i");
      const result = await Product.updateMany(
        { name: regex, deletedAt: null },
        { $addToSet: { categories: rule.category } }
      );
      if (result.modifiedCount > 0 || result.matchedCount > 0) {
        console.log(
          `  [${rule.category}] pattern="${pattern}" → matched: ${result.matchedCount}, updated: ${result.modifiedCount}`
        );
        totalUpdated += result.modifiedCount;
      }
    }
  }

  // Print summary of all products and their assigned categories
  console.log("\n── Product category summary ─────────────────────────────────");
  const products = await Product.find({ deletedAt: null }, "name categories").sort({ name: 1 }).collation({ locale: "en", strength: 2 });
  const unassigned = [];
  for (const p of products) {
    if (p.categories && p.categories.length > 0) {
      console.log(`  ✓ ${p.name} → [${p.categories.join(", ")}]`);
    } else {
      unassigned.push(p.name);
    }
  }
  if (unassigned.length > 0) {
    console.log(`\n── Products with no category assigned (${unassigned.length}) ─────`);
    unassigned.forEach((name) => console.log(`  - ${name}`));
  }

  console.log(`\n✓ Migration complete. ${totalUpdated} product(s) updated.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
