const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const PullOut = require("../models/PullOut");
const logActivity = require("../utils/activityLogger");

// CREATE
exports.addItem = async (req, res) => {
  try {
    const { productId, quantity, price, expirationDate } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const item = new Inventory({ product: productId, quantity, price, expirationDate });
    await item.save();
    await item.populate("product", "name unit");

    logActivity({
      userId: req.user.id,
      action: "add",
      module: "inventory",
      description: `Added inventory batch for '${product.name}'`,
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
    const items = await Inventory.find({ status: { $ne: "pulled_out" } })
      .populate("product", "name unit")
      .sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Get items failed" });
  }
};

// UPDATE
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, quantity, price, expirationDate } = req.body;

    const updateData = { quantity, price, expirationDate, updatedAt: Date.now() };
    if (productId) updateData.product = productId;

    const updatedItem = await Inventory.findByIdAndUpdate(id, updateData, { new: true }).populate(
      "product",
      "name unit"
    );

    logActivity({
      userId: req.user.id,
      action: "edit",
      module: "inventory",
      description: `Updated inventory batch for '${updatedItem.product.name}'`,
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

    const item = await Inventory.findById(id).populate("product", "name");
    if (!item) return res.status(404).json({ error: "Item not found" });

    await Inventory.findByIdAndDelete(id);

    logActivity({
      userId: req.user.id,
      action: "delete",
      module: "inventory",
      description: `Deleted inventory batch for '${item.product.name}'`,
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

    const item = await Inventory.findById(id).populate("product", "name");

    if (!item) return res.status(404).json({ error: "Item not found" });
    if (quantity <= 0) return res.status(400).json({ error: "Quantity must be greater than 0" });
    if (quantity > item.quantity) return res.status(400).json({ error: "Not enough stock available" });

    const sale = new Sale({
      itemName: item.product.name,
      product: item.product._id,
      inventoryItemId: item._id,
      quantity,
      price: item.price,
    });
    await sale.save();

    item.quantity -= quantity;
    item.updatedAt = Date.now();
    await item.save();

    logActivity({
      userId: req.user.id,
      action: "sell",
      module: "inventory",
      description: `Sold ${quantity} of '${item.product.name}' for ₱${sale.total}`,
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
    const { quantityPulledOut, reason, addReplacement, replacementQuantity, replacementExpirationDate } = req.body;

    const item = await Inventory.findById(id).populate("product", "name");
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (quantityPulledOut <= 0) return res.status(400).json({ error: "Quantity must be greater than 0" });
    if (quantityPulledOut > item.quantity) return res.status(400).json({ error: "Not enough stock available" });

    const isFullPullOut = quantityPulledOut === item.quantity;

    if (isFullPullOut) {
      item.status = "pulled_out";
      item.pullOutReason = reason;
      item.quantity = 0;
    } else {
      item.quantity -= quantityPulledOut;
    }
    item.updatedAt = Date.now();

    let replacementItem = null;
    if (addReplacement) {
      replacementItem = new Inventory({
        product: item.product._id,
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

    const pullOut = new PullOut({
      inventoryItemId: item._id,
      product: item.product._id,
      itemName: item.product.name,
      quantityPulledOut: Number(quantityPulledOut),
      reason,
      pulledOutBy: req.user.id,
      replacedByItemId: replacementItem ? replacementItem._id : undefined,
    });
    await pullOut.save();

    const replacementNote = replacementItem ? ` and replaced with ${replacementQuantity} new units` : "";

    logActivity({
      userId: req.user.id,
      action: "pull_out",
      module: "inventory",
      description: `Pulled out ${quantityPulledOut} of '${item.product.name}' (${reason})${replacementNote}`,
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
      .populate({
        path: "replacedByItemId",
        select: "quantity expirationDate product",
        populate: { path: "product", select: "name" },
      })
      .sort({ date: -1 });

    res.json(pullOuts);
  } catch (error) {
    res.status(500).json({ error: "Get pull outs failed" });
  }
};
