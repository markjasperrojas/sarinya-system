const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const logActivity = require("../utils/activityLogger");
const { CATEGORY_VALUES } = require("../constants/categories");
const AppError = require("../utils/AppError");

// GET all products
exports.getProducts = async (req, res) => {
  const products = await Product.find({ deletedAt: null }).sort({ name: 1 }).collation({ locale: "en", strength: 2 });
  res.json(products);
};

// CREATE product
exports.addProduct = async (req, res) => {
  const { name, price, image_url, categories } = req.body;

  if (!name || !name.trim()) throw new AppError("Product name is required", 400);
  if (price === undefined || price === null || price === "") throw new AppError("Price is required", 400);
  if (Number(price) < 0) throw new AppError("Price cannot be negative", 400);

  const safeCategories = Array.isArray(categories) ? categories.filter((c) => CATEGORY_VALUES.includes(c)) : [];

  const existing = await Product.findOne({ name: name.trim(), deletedAt: null }).collation({ locale: "en", strength: 2 });
  if (existing) throw new AppError("A product with this name already exists", 400);

  const product = new Product({ name: name.trim(), price: Number(price), image_url: image_url || null, categories: safeCategories });
  await product.save();
  res.json({ message: "Product created!", product });
};

// UPDATE product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, image_url, categories } = req.body;

  if (name) {
    const existing = await Product.findOne({ name: name.trim(), _id: { $ne: id }, deletedAt: null }).collation({ locale: "en", strength: 2 });
    if (existing) throw new AppError("A product with this name already exists", 400);
  }

  const updateFields = {
    name: name?.trim(),
    price: price !== undefined ? Number(price) : undefined,
    image_url: image_url !== undefined ? (image_url || null) : undefined,
    categories: categories !== undefined ? categories.filter((c) => CATEGORY_VALUES.includes(c)) : undefined,
  };

  const product = await Product.findOneAndUpdate(
    { _id: id, deletedAt: null },
    updateFields,
    { new: true, omitUndefined: true }
  );
  if (!product) throw new AppError("Product not found", 404);
  res.json({ message: "Product updated!", product });
};

// DELETE product (soft)
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  // Only block if there is real active stock remaining
  const activeStock = await Inventory.countDocuments({ product: id, status: "active", quantity: { $gt: 0 }, deletedAt: null });
  if (activeStock > 0) {
    throw new AppError("Cannot delete a product that has existing inventory batches", 400);
  }

  const product = await Product.findOne({ _id: id, deletedAt: null });
  if (!product) throw new AppError("Product not found", 404);

  const now = new Date();

  // Soft-delete orphaned inventory records (zero-qty or pulled-out)
  await Inventory.updateMany({ product: id, deletedAt: null }, { $set: { deletedAt: now } });

  // Soft-delete the product
  product.deletedAt = now;
  await product.save();

  logActivity({
    userId: req.user.id,
    action: "delete",
    module: "inventory",
    description: `Deleted product '${product.name}'`,
    targetId: product._id,
  });

  res.json({ message: "Product deleted!" });
};
