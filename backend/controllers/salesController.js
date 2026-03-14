const mongoose = require("mongoose");
const { randomUUID } = require("crypto");
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const logActivity = require("../utils/activityLogger");

// CREATE SALE
exports.addSale = async (req, res) => {
  try {
    const { productId, quantity, price } = req.body;

    const product = await Product.findOne({ _id: productId, deletedAt: null });
    if (!product) return res.status(404).json({ error: "Product not found" });

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
  } catch (error) {
    res.status(500).json({ error: "Add sale failed" });
  }
};

// READ ALL SALES
exports.getSales = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Get sales failed" });
  }
};

// UPDATE SALE
exports.updateSale = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Update sale failed" });
  }
};

// GET MONTHLY SALES ANALYTICS
exports.getMonthlySales = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Get monthly sales failed" });
  }
};

// GET DAILY SALES ANALYTICS
exports.getDailySales = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Get daily sales failed" });
  }
};

// GET AVAILABLE YEARS
exports.getAvailableYears = async (req, res) => {
  try {
    const result = await Sale.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: { $year: "$date" } } },
      { $sort: { _id: 1 } },
    ]);
    const years = result.map((r) => r._id);
    res.json(years);
  } catch (error) {
    res.status(500).json({ error: "Get available years failed" });
  }
};

// Shared FEFO deduction helper — validates items and builds deductions list
async function buildDeductions(items, mongoSession) {
  const deductions = [];
  for (const item of items) {
    const { productId, quantity } = item;
    if (!productId || !quantity || quantity <= 0) throw new Error("Invalid item data");

    const product = await Product.findOne({ _id: productId, deletedAt: null }).session(mongoSession);
    if (!product) throw new Error(`Product not found`);

    const batches = await Inventory.find({
      product: productId,
      status: { $ne: "pulled_out" },
      quantity: { $gt: 0 },
      deletedAt: null,
    })
      .sort({ expirationDate: 1 })
      .session(mongoSession);

    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
    if (totalAvailable < quantity) {
      throw new Error(
        `Not enough stock for "${product.name}". Available: ${totalAvailable}, requested: ${quantity}`
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
async function applyDeductions(deductions, saleSessionId, mongoSession) {
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
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const saleSessionId = randomUUID();
    const deductions = await buildDeductions(items, session);
    const createdSales = await applyDeductions(deductions, saleSessionId, session);

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
    res.status(400).json({ error: error.message || "Bulk sell failed" });
  } finally {
    session.endSession();
  }
};

// GET RECENT SESSIONS (today's orders grouped by saleSessionId)
exports.getRecentSessions = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Get recent sessions failed" });
  }
};

// GET SESSION DETAIL (all sale records for a session)
exports.getSessionDetail = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sales = await Sale.find({ saleSessionId: sessionId, deletedAt: null })
      .populate("product", "name price")
      .sort({ date: 1 });
    res.json({ saleSessionId: sessionId, sales });
  } catch (error) {
    res.status(500).json({ error: "Get session detail failed" });
  }
};

// ADD ITEMS TO EXISTING SESSION
exports.addItemsToSession = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { sessionId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const existing = await Sale.findOne({ saleSessionId: sessionId, deletedAt: null }).session(session);
    if (!existing) return res.status(404).json({ error: "Session not found" });

    const deductions = await buildDeductions(items, session);
    const createdSales = await applyDeductions(deductions, sessionId, session);

    await session.commitTransaction();

    logActivity({
      userId: req.user.id,
      action: "edit",
      module: "sales",
      description: `Added ${items.length} item(s) to session ${sessionId}`,
    });

    res.json({ message: "Items added to order!", sales: createdSales });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message || "Add items to session failed" });
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
    if (!sale) return res.status(404).json({ error: "Sale item not found" });

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
    res.status(500).json({ error: "Remove session item failed" });
  } finally {
    session.endSession();
  }
};

// DELETE SALE (soft)
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findOne({ _id: id, deletedAt: null }).populate("product", "name");
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

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
  } catch (error) {
    res.status(500).json({ error: "Delete sale failed" });
  }
};
