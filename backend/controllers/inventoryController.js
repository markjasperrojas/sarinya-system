const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");
const PullOut = require("../models/PullOut");
const logActivity = require("../utils/activityLogger");

// CREATE
exports.addItem = async (req, res) => {
  try {
    const { name, quantity, price, expirationDate } = req.body;

    const item = new Inventory({ name, quantity, price, expirationDate });
    await item.save();

    logActivity({
      userId: req.user.id,
      action: "add",
      module: "inventory",
      description: `Added inventory item '${name}'`,
      targetId: item._id,
    });

    res.json({ message: "Item added!", item });
  } catch (error) {
    res.status(500).json({ error: "Add item failed" });
  }
};

// READ ALL (active items only)
exports.getItems = async (req, res) => {
  try {
    const items = await Inventory.find({ status: { $ne: "pulled_out" } }).sort({ updatedAt: -1 });
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

    logActivity({
      userId: req.user.id,
      action: "edit",
      module: "inventory",
      description: `Updated inventory item '${updatedItem.name}'`,
      targetId: updatedItem._id,
    });

    res.json({ message: "Item updated!", updatedItem });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};

// DELETE
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    await Inventory.findByIdAndDelete(id);

    logActivity({
      userId: req.user.id,
      action: "delete",
      module: "inventory",
      description: `Deleted inventory item '${item.name}'`,
      targetId: item._id,
    });

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
      inventoryItemId: item._id,
      quantity,
      price: item.price,
    });
    await sale.save();

    // Decrease inventory quantity
    item.quantity -= quantity;
    item.updatedAt = Date.now();
    await item.save();

    logActivity({
      userId: req.user.id,
      action: "sell",
      module: "inventory",
      description: `Sold ${quantity} of '${item.name}' for ₱${sale.total}`,
      targetId: item._id,
    });

    res.json({ message: "Sale completed!", sale, updatedItem: item });
  } catch (error) {
    res.status(500).json({ error: "Sell item failed" });
  }
};

// PULL OUT ITEM
exports.pullOutItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quantityPulledOut,
      reason,
      addReplacement,
      replacementQuantity,
      replacementExpirationDate,
    } = req.body;

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (quantityPulledOut <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    if (quantityPulledOut > item.quantity) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    const isFullPullOut = quantityPulledOut === item.quantity;

    // Update the original item
    if (isFullPullOut) {
      item.status = "pulled_out";
      item.pullOutReason = reason;
      item.quantity = 0;
    } else {
      item.quantity -= quantityPulledOut;
    }
    item.updatedAt = Date.now();

    // Create replacement item if requested
    let replacementItem = null;
    if (addReplacement) {
      replacementItem = new Inventory({
        name: item.name,
        quantity: Number(replacementQuantity),
        price: item.price,
        expirationDate: replacementExpirationDate,
        status: "active",
        replacedFrom: item._id,
      });
      await replacementItem.save();

      if (isFullPullOut) {
        item.replacedBy = replacementItem._id;
      }
    }

    await item.save();

    // Create PullOut record
    const pullOut = new PullOut({
      inventoryItemId: item._id,
      itemName: item.name,
      quantityPulledOut: Number(quantityPulledOut),
      reason,
      pulledOutBy: req.user.id,
      replacedByItemId: replacementItem ? replacementItem._id : undefined,
    });
    await pullOut.save();

    const replacementNote = replacementItem
      ? ` and replaced with ${replacementQuantity} new units`
      : "";

    logActivity({
      userId: req.user.id,
      action: "pull_out",
      module: "inventory",
      description: `Pulled out ${quantityPulledOut} of '${item.name}' (${reason})${replacementNote}`,
      targetId: item._id,
    });

    res.json({ message: "Pull out recorded!", pullOut, replacementItem });
  } catch (error) {
    res.status(500).json({ error: "Pull out failed" });
  }
};

// GET PULL OUTS (for discrepancies tab)
exports.getPullOuts = async (req, res) => {
  try {
    const pullOuts = await PullOut.find()
      .populate("pulledOutBy", "username")
      .populate("replacedByItemId", "name quantity expirationDate")
      .sort({ date: -1 });

    res.json(pullOuts);
  } catch (error) {
    res.status(500).json({ error: "Get pull outs failed" });
  }
};
