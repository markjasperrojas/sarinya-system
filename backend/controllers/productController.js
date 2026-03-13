const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const logActivity = require("../utils/activityLogger");

// GET all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ deletedAt: null }).sort({ name: 1 }).collation({ locale: "en", strength: 2 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Get products failed" });
  }
};

// CREATE product
exports.addProduct = async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: "Product name is required" });
    if (price === undefined || price === null || price === "") return res.status(400).json({ error: "Price is required" });
    if (Number(price) < 0) return res.status(400).json({ error: "Price cannot be negative" });

    const existing = await Product.findOne({ name: name.trim(), deletedAt: null }).collation({ locale: "en", strength: 2 });
    if (existing) return res.status(400).json({ error: "A product with this name already exists" });

    const product = new Product({ name: name.trim(), price: Number(price) });
    await product.save();
    res.json({ message: "Product created!", product });
  } catch (error) {
    res.status(500).json({ error: "Add product failed" });
  }
};

// UPDATE product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    if (name) {
      const existing = await Product.findOne({ name: name.trim(), _id: { $ne: id }, deletedAt: null }).collation({ locale: "en", strength: 2 });
      if (existing) return res.status(400).json({ error: "A product with this name already exists" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { name: name?.trim(), price: price !== undefined ? Number(price) : undefined },
      { new: true, omitUndefined: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product updated!", product });
  } catch (error) {
    res.status(500).json({ error: "Update product failed" });
  }
};

// DELETE product (soft)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Only block if there is real active stock remaining
    const activeStock = await Inventory.countDocuments({ product: id, status: "active", quantity: { $gt: 0 }, deletedAt: null });
    if (activeStock > 0) {
      return res.status(400).json({ error: "Cannot delete a product that has existing inventory batches" });
    }

    const product = await Product.findOne({ _id: id, deletedAt: null });
    if (!product) return res.status(404).json({ error: "Product not found" });

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
  } catch (error) {
    res.status(500).json({ error: "Delete product failed" });
  }
};
