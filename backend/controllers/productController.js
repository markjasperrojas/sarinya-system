const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

// GET all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Get products failed" });
  }
};

// CREATE product
exports.addProduct = async (req, res) => {
  try {
    const { name, unit } = req.body;
    const product = new Product({ name, unit });
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
    const { name, unit } = req.body;
    const product = await Product.findByIdAndUpdate(id, { name, unit }, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product updated!", product });
  } catch (error) {
    res.status(500).json({ error: "Update product failed" });
  }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const inventoryCount = await Inventory.countDocuments({ product: id });
    if (inventoryCount > 0) {
      return res.status(400).json({ error: "Cannot delete a product that has existing inventory batches" });
    }
    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted!" });
  } catch (error) {
    res.status(500).json({ error: "Delete product failed" });
  }
};
