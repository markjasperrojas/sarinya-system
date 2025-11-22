const Inventory = require("../models/Inventory");

// CREATE
exports.addItem = async (req, res) => {
  try {
    const { name, quantity, unit } = req.body;

    const item = new Inventory({ name, quantity, unit });
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
    const { name, quantity, unit } = req.body;

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { name, quantity, unit, updatedAt: Date.now() },
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
