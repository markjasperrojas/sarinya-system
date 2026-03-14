const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const PullOut = require("../models/PullOut");
const logActivity = require("../utils/activityLogger");
const AppError = require("../utils/AppError");

// CREATE
exports.addItem = async (req, res) => {
  const { productId, quantity, expirationDate } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);

  // Normalize expiry to start-of-day for duplicate detection
  const expDate = new Date(expirationDate);
  const startOfDay = new Date(expDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(expDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Auto-merge if same product + same expiry date already has an active batch
  const existingBatch = await Inventory.findOne({
    product: productId,
    status: { $ne: "pulled_out" },
    expirationDate: { $gte: startOfDay, $lte: endOfDay },
    deletedAt: null,
  });

  if (existingBatch) {
    existingBatch.quantity += Number(quantity);
    existingBatch.updatedAt = Date.now();
    await existingBatch.save();
    await existingBatch.populate("product", "name price");

    logActivity({
      userId: req.user.id,
      action: "edit",
      module: "inventory",
      description: `Merged ${quantity} units into existing '${product.name}' batch (expiry ${expDate.toLocaleDateString()})`,
      targetId: existingBatch._id,
    });

    return res.json({ message: "Merged into existing batch!", item: existingBatch, merged: true });
  }

  const item = new Inventory({ product: productId, quantity, expirationDate });
  await item.save();
  await item.populate("product", "name price");

  logActivity({
    userId: req.user.id,
    action: "add",
    module: "inventory",
    description: `Added inventory batch for '${product.name}'`,
    targetId: item._id,
  });

  res.json({ message: "Item added!", item });
};

// READ ALL (active items only)
exports.getItems = async (req, res) => {
  const items = await Inventory.find({ status: { $ne: "pulled_out" }, deletedAt: null })
    .populate("product", "name price")
    .sort({ updatedAt: -1 });
  res.json(items);
};

// UPDATE
exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { quantity, expirationDate } = req.body;

  const updateData = { quantity, expirationDate, updatedAt: Date.now() };

  const updatedItem = await Inventory.findByIdAndUpdate(id, updateData, { new: true }).populate(
    "product",
    "name price"
  );

  logActivity({
    userId: req.user.id,
    action: "edit",
    module: "inventory",
    description: `Updated inventory batch for '${updatedItem.product.name}'`,
    targetId: updatedItem._id,
  });

  res.json({ message: "Item updated!", updatedItem });
};

// DELETE (soft)
exports.deleteItem = async (req, res) => {
  const { id } = req.params;

  const item = await Inventory.findOne({ _id: id, deletedAt: null }).populate("product", "name");
  if (!item) throw new AppError("Item not found", 404);

  item.deletedAt = new Date();
  await item.save();

  logActivity({
    userId: req.user.id,
    action: "delete",
    module: "inventory",
    description: `Deleted inventory batch for '${item.product.name}'`,
    targetId: item._id,
  });

  res.json({ message: "Item deleted!" });
};

// SELL ITEM
exports.sellItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const item = await Inventory.findById(id).populate("product", "name price");

  if (!item) throw new AppError("Item not found", 404);
  if (quantity <= 0) throw new AppError("Quantity must be greater than 0", 400);
  if (quantity > item.quantity) throw new AppError("Not enough stock available", 400);

  const price = item.product.price;

  const sale = new Sale({
    product: item.product._id,
    inventoryItemId: item._id,
    quantity,
    price,
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
};

// PULL OUT ITEM
exports.pullOutItem = async (req, res) => {
  const { id } = req.params;
  const { quantityPulledOut, reason, addReplacement, replacementQuantity, replacementExpirationDate } = req.body;

  const item = await Inventory.findById(id).populate("product", "name price");
  if (!item) throw new AppError("Item not found", 404);

  if (quantityPulledOut <= 0) throw new AppError("Quantity must be greater than 0", 400);
  if (quantityPulledOut > item.quantity) throw new AppError("Not enough stock available", 400);

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
};

// GET PULL OUTS (for discrepancies tab)
exports.getPullOuts = async (req, res) => {
  const pullOuts = await PullOut.find()
    .populate("product", "name")
    .populate("pulledOutBy", "username")
    .populate({
      path: "replacedByItemId",
      select: "quantity expirationDate product",
      populate: { path: "product", select: "name" },
    })
    .sort({ date: -1 });

  res.json(pullOuts);
};
