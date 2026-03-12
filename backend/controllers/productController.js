const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

// GET all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 }).collation({ locale: "en", strength: 2 });
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

    const existing = await Product.findOne({ name: name.trim() }).collation({ locale: "en", strength: 2 });
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
      const existing = await Product.findOne({ name: name.trim(), _id: { $ne: id } }).collation({ locale: "en", strength: 2 });
      if (existing) return res.status(400).json({ error: "A product with this name already exists" });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { name: name?.trim(), price: price !== undefined ? Number(price) : undefined },
      { new: true, omitUndefined: true }
    );
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
