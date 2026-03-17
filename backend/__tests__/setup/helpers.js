const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Product = require("../../models/Product");
const Inventory = require("../../models/Inventory");

/**
 * Creates a user in the DB and returns both the user document and a signed JWT.
 * plainPassword defaults to "password123".
 */
async function createUserAndToken({ username, password: plainPassword, role, isActive } = {}) {
  const pw = plainPassword || "password123";
  const hashedPassword = await bcrypt.hash(pw, 10);

  const user = await User.create({
    username: username || `testuser_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    password: hashedPassword,
    role: role || "staff",
    isActive: isActive !== undefined ? isActive : true,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "test-jwt-secret-for-testing-only", {
    expiresIn: "1d",
  });

  return { user, token };
}

/**
 * Creates a product in the DB.
 */
async function createProduct(overrides = {}) {
  const { name, price, ...rest } = overrides;
  return Product.create({
    name: name || `Product_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    price: price !== undefined ? price : 100,
    ...rest,
  });
}

/**
 * Creates an inventory batch in the DB for the given productId.
 */
async function createInventoryBatch(productId, overrides = {}) {
  const { quantity, expirationDate, ...rest } = overrides;
  return Inventory.create({
    product: productId,
    quantity: quantity !== undefined ? quantity : 10,
    expirationDate: expirationDate || new Date("2026-12-31T00:00:00.000Z"),
    ...rest,
  });
}

module.exports = { createUserAndToken, createProduct, createInventoryBatch };
