const mongoose = require("mongoose");
const { randomUUID } = require("crypto");
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const logActivity = require("../utils/activityLogger");
const AppError = require("../utils/AppError");

// CREATE SALE
exports.addSale = async (req, res) => {
  const { productId, quantity, price } = req.body;

  const product = await Product.findOne({ _id: productId, deletedAt: null });
  if (!product) throw new AppError("Product not found", 404);

  const sale = new Sale({ product: productId, quantity, price });
  await sale.save();

  logActivity({
    userId: req.user.id,
    action: "add",
    module: "sales",
    description: `Added sale record for '${product.name}'`,
    targetId: sale._id,
  });

  res.json({ message: "Sale recorded!", sale });
};

// READ ALL SALES
exports.getSales = async (req, res) => {
  const { search, timeRange, date, page = 1, limit = 20, grouped } = req.query;
  let query = { deletedAt: null };

  // Search filter — join Product to search by name
  if (search) {
    const matchingProducts = await Product.find({
      name: { $regex: search, $options: "i" },
      deletedAt: null,
    }).select("_id");
    query.product = { $in: matchingProducts.map((p) => p._id) };
  }

  // Specific Date filter (overrides timeRange)
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    query.date = { $gte: startDate, $lte: endDate };
  }
  // Time range filter (only if no specific date)
  else if (timeRange) {
    const now = new Date();
    let startDate = new Date(); // default to now

    switch (timeRange) {
      case "daily":
        startDate.setHours(0, 0, 0, 0); // Start of today
        break;
      case "weekly":
        // Start of the week (Sunday)
        const day = now.getDay();
        const diff = now.getDate() - day;
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        startDate.setDate(1); // 1st day of month
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yearly":
        startDate.setMonth(0, 1); // Jan 1st
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = null; // No filtering if invalid range (or "all")
    }

    if (startDate) {
      query.date = { $gte: startDate };
    }
  }

  // Grouped by product view
  if (grouped === "true") {
    const result = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$product",
          quantity: { $sum: "$quantity" },
          total: { $sum: { $multiply: ["$quantity", "$price"] } },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDoc",
        },
      },
      {
        $addFields: {
          productName: { $arrayElemAt: ["$productDoc.name", 0] },
        },
      },
      { $project: { productDoc: 0 } },
      { $sort: { total: -1 } },
    ]);
    return res.json({ sales: result, pagination: null });
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [sales, total] = await Promise.all([
    Sale.find(query).populate("product", "name").sort({ date: -1 }).skip(skip).limit(limitNum),
    Sale.countDocuments(query),
  ]);

  res.json({
    sales,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
};

// UPDATE SALE
exports.updateSale = async (req, res) => {
  const { id } = req.params;
  const { quantity, price } = req.body;

  const updatedSale = await Sale.findByIdAndUpdate(
    id,
    { quantity, price },
    { new: true }
  ).populate("product", "name");

  logActivity({
    userId: req.user.id,
    action: "edit",
    module: "sales",
    description: `Updated sale record for '${updatedSale.product?.name}'`,
    targetId: updatedSale._id,
  });

  res.json({ message: "Sale updated!", updatedSale });
};

// GET MONTHLY SALES ANALYTICS
exports.getMonthlySales = async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const result = await Sale.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate }, deletedAt: null } },
    { $group: { _id: { $month: "$date" }, revenue: { $sum: { $multiply: ["$quantity", "$price"] } } } },
    { $sort: { _id: 1 } },
  ]);

  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const revenueMap = {};
  result.forEach((r) => { revenueMap[r._id] = r.revenue; });

  const monthly = MONTH_LABELS.map((label, i) => ({
    month: i + 1,
    label,
    revenue: revenueMap[i + 1] || 0,
  }));

  res.json(monthly);
};

// GET DAILY SALES ANALYTICS
exports.getDailySales = async (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const clampedMonth = Math.max(1, Math.min(12, month));

  const startDate = new Date(year, clampedMonth - 1, 1);
  const endDate   = new Date(year, clampedMonth, 0, 23, 59, 59, 999);

  const result = await Sale.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate }, deletedAt: null } },
    {
      $group: {
        _id: { $dayOfMonth: "$date" },
        revenue: { $sum: { $multiply: ["$quantity", "$price"] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const revenueMap = {};
  result.forEach((r) => { revenueMap[r._id] = r.revenue; });

  const daysInMonth = new Date(year, clampedMonth, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    label: String(i + 1),
    revenue: revenueMap[i + 1] || 0,
  }));

  res.json(daily);
};

// GET AVAILABLE YEARS
exports.getAvailableYears = async (req, res) => {
  const result = await Sale.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: { $year: "$date" } } },
    { $sort: { _id: 1 } },
  ]);
  const years = result.map((r) => r._id);
  res.json(years);
};

// Shared FEFO deduction helper — validates items and builds deductions list
async function buildDeductions(items, mongoSession) {
  const deductions = [];
  for (const item of items) {
    const { productId, quantity } = item;
    if (!productId || !quantity || quantity <= 0) throw new AppError("Invalid item data", 400);

    const product = await Product.findOne({ _id: productId, deletedAt: null }).session(mongoSession);
    if (!product) throw new AppError("Product not found", 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const batches = await Inventory.find({
      product: productId,
      status: { $ne: "pulled_out" },
      quantity: { $gt: 0 },
      deletedAt: null,
      expirationDate: { $gte: today },
    })
      .sort({ expirationDate: 1 })
      .session(mongoSession);

    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
    if (totalAvailable < quantity) {
      throw new AppError(
        `Not enough stock for "${product.name}". Available: ${totalAvailable}, requested: ${quantity}`,
        400
      );
    }

    let remaining = quantity;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      deductions.push({ batch, product, take });
      remaining -= take;
    }
  }
  return deductions;
}

// Applies deductions and creates Sale records for a given saleSessionId
async function applyDeductions(deductions, saleSessionId, notes, mongoSession) {
  const createdSales = [];
  for (const { batch, product, take } of deductions) {
    batch.quantity -= take;
    batch.updatedAt = new Date();
    await batch.save({ session: mongoSession });

    const sale = new Sale({
      product: product._id,
      inventoryItemId: batch._id,
      quantity: take,
      price: product.price,
      saleSessionId,
      notes: notes || "",
    });
    await sale.save({ session: mongoSession });
    createdSales.push(sale);
  }
  return createdSales;
}

// BULK SELL (multi-sell POS)
exports.bulkSell = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError("No items provided", 400);
    }

    const saleSessionId = randomUUID();
    const deductions = await buildDeductions(items, session);
    const createdSales = await applyDeductions(deductions, saleSessionId, notes, session);

    await session.commitTransaction();

    logActivity({
      userId: req.user.id,
      action: "sell",
      module: "sales",
      description: `Multi-sell: ${items.length} product(s), session ${saleSessionId}`,
    });

    res.json({ message: "Sale processed!", sales: createdSales, saleSessionId });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// GET RECENT SESSIONS (today's orders grouped by saleSessionId)
exports.getRecentSessions = async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const sessions = await Sale.aggregate([
    { $match: { deletedAt: null, date: { $gte: startOfToday } } },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    {
      $addFields: {
        productName: { $arrayElemAt: ["$productDoc.name", 0] },
      },
    },
    {
      $group: {
        _id: "$saleSessionId",
        createdAt: { $min: "$date" },
        total: { $sum: { $multiply: ["$quantity", "$price"] } },
        notes: { $first: "$notes" },
        items: {
          $push: {
            productId: "$product",
            productName: "$productName",
            quantity: "$quantity",
            price: "$price",
          },
        },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 20 },
  ]);

  res.json(sessions);
};

// GET SESSION DETAIL (all sale records for a session)
exports.getSessionDetail = async (req, res) => {
  const { sessionId } = req.params;
  const sales = await Sale.find({ saleSessionId: sessionId, deletedAt: null })
    .populate("product", "name price")
    .sort({ date: 1 });
  res.json({ saleSessionId: sessionId, sales });
};

// ADD ITEMS TO EXISTING SESSION (also handles notes-only update)
exports.addItemsToSession = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { sessionId } = req.params;
    const { items, notes } = req.body;

    const hasItems = Array.isArray(items) && items.length > 0;
    const hasNotes = typeof notes === "string";

    if (!hasItems && !hasNotes) {
      throw new AppError("No items or notes provided", 400);
    }

    const existing = await Sale.findOne({ saleSessionId: sessionId, deletedAt: null }).session(session);
    if (!existing) throw new AppError("Session not found", 404);

    // Update notes on all existing records in this session if notes provided
    if (hasNotes) {
      await Sale.updateMany(
        { saleSessionId: sessionId, deletedAt: null },
        { $set: { notes } },
        { session }
      );
    }

    let createdSales = [];
    if (hasItems) {
      const deductions = await buildDeductions(items, session);
      createdSales = await applyDeductions(deductions, sessionId, hasNotes ? notes : existing.notes, session);
    }

    await session.commitTransaction();

    logActivity({
      userId: req.user.id,
      action: "edit",
      module: "sales",
      description: `Updated session ${sessionId}${hasItems ? `: added ${items.length} item(s)` : ""}${hasNotes ? " (notes updated)" : ""}`,
    });

    res.json({ message: "Order updated!", sales: createdSales });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// UPDATE QUANTITY OF A PRODUCT IN SESSION (atomic swap: restore old, deduct new)
exports.updateSessionItemQty = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { sessionId } = req.params;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      throw new AppError("Valid productId and quantity (≥ 1) required", 400);
    }

    const existingSales = await Sale.find({
      saleSessionId: sessionId,
      product: productId,
      deletedAt: null,
    })
      .session(session)
      .populate("product", "name");

    if (existingSales.length === 0) throw new AppError("Product not found in this session", 404);

    const oldTotal = existingSales.reduce((sum, s) => sum + s.quantity, 0);
    if (quantity === oldTotal) {
      await session.commitTransaction();
      return res.json({ message: "No change needed" });
    }

    const notes = existingSales[0]?.notes || "";

    // Restore inventory for all existing records
    for (const sale of existingSales) {
      if (sale.inventoryItemId) {
        const batch = await Inventory.findById(sale.inventoryItemId).session(session);
        if (batch) {
          batch.quantity += sale.quantity;
          batch.updatedAt = new Date();
          await batch.save({ session });
        }
      }
      sale.deletedAt = new Date();
      await sale.save({ session });
    }

    // Re-create with new quantity using FEFO deduction
    const deductions = await buildDeductions([{ productId, quantity }], session);
    await applyDeductions(deductions, sessionId, notes, session);

    await session.commitTransaction();

    logActivity({
      userId: req.user.id,
      action: "edit",
      module: "sales",
      description: `Updated qty for product in session ${sessionId}: ${oldTotal} → ${quantity}`,
    });

    res.json({ message: "Item quantity updated!" });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// REMOVE ITEM FROM SESSION (restores inventory)
exports.removeSessionItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { sessionId, saleId } = req.params;

    const sale = await Sale.findOne({ _id: saleId, saleSessionId: sessionId, deletedAt: null })
      .session(session)
      .populate("product", "name");
    if (!sale) throw new AppError("Sale item not found", 404);

    const remainingCount = await Sale.countDocuments({
      saleSessionId: sessionId,
      deletedAt: null,
      _id: { $ne: saleId },
    }).session(session);
    if (remainingCount === 0)
      throw new AppError("Cannot remove the last item from an order", 400);

    if (sale.inventoryItemId) {
      const batch = await Inventory.findById(sale.inventoryItemId).session(session);
      if (batch) {
        batch.quantity += sale.quantity;
        batch.updatedAt = new Date();
        await batch.save({ session });
      }
    }

    sale.deletedAt = new Date();
    await sale.save({ session });

    await session.commitTransaction();

    logActivity({
      userId: req.user.id,
      action: "delete",
      module: "sales",
      description: `Removed '${sale.product?.name}' from session ${sessionId}`,
      targetId: sale._id,
    });

    res.json({ message: "Item removed from order!" });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// DELETE SALE (soft)
exports.deleteSale = async (req, res) => {
  const { id } = req.params;

  const sale = await Sale.findOne({ _id: id, deletedAt: null }).populate("product", "name");
  if (!sale) throw new AppError("Sale not found", 404);

  sale.deletedAt = new Date();
  await sale.save();

  logActivity({
    userId: req.user.id,
    action: "delete",
    module: "sales",
    description: `Deleted sale record for '${sale.product?.name}'`,
    targetId: sale._id,
  });

  res.json({ message: "Sale deleted!" });
};
