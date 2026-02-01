const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");

// CREATE
exports.addItem = async (req, res) => {
  try {
    const { name, quantity, price, expirationDate } = req.body;

    const item = new Inventory({ name, quantity, price, expirationDate });
    await item.save();

    res.json({ message: "Item added!", item });
  } catch (error) {
    res.status(500).json({ error: "Add item failed" });
  }
};

// READ ALL
exports.getItems = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Get items failed" });
  }
};

// UPDATE
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, price, expirationDate } = req.body;

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { name, quantity, price, expirationDate, updatedAt: Date.now() },
      { new: true }
    );

    res.json({ message: "Item updated!", updatedItem });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};

// DELETE
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    await Inventory.findByIdAndDelete(id);

    res.json({ message: "Item deleted!" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};

// SELL ITEM
exports.sellItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await Inventory.findById(id);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    if (quantity > item.quantity) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    // Create sale record
    const sale = new Sale({
      itemName: item.name,
      quantity,
      price: item.price,
      total: quantity * item.price,
    });
    await sale.save();

    // Decrease inventory quantity
    item.quantity -= quantity;
    item.updatedAt = Date.now();
    await item.save();

    res.json({ message: "Sale completed!", sale, updatedItem: item });
  } catch (error) {
    res.status(500).json({ error: "Sell item failed" });
  }
};
