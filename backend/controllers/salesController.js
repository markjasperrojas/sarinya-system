const Sale = require("../models/Sale");
const logActivity = require("../utils/activityLogger");

// CREATE SALE
exports.addSale = async (req, res) => {
  try {
    const { itemName, quantity, price } = req.body;

    const sale = new Sale({ itemName, quantity, price });
    await sale.save();

    logActivity({
      userId: req.user.id,
      action: "add",
      module: "sales",
      description: `Added sale record for '${itemName}'`,
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
    const { search, timeRange, date } = req.query;
    let query = {};

    // Search filter
    if (search) {
      query.itemName = { $regex: search, $options: "i" };
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

    const sales = await Sale.find(query).sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: "Get sales failed" });
  }
};

// UPDATE SALE
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, quantity, price } = req.body;

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      { itemName, quantity, price },
      { new: true }
    );

    logActivity({
      userId: req.user.id,
      action: "edit",
      module: "sales",
      description: `Updated sale record for '${updatedSale.itemName}'`,
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
      { $match: { date: { $gte: startDate, $lte: endDate } } },
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

// GET AVAILABLE YEARS
exports.getAvailableYears = async (req, res) => {
  try {
    const result = await Sale.aggregate([
      { $group: { _id: { $year: "$date" } } },
      { $sort: { _id: 1 } },
    ]);
    const years = result.map((r) => r._id);
    res.json(years);
  } catch (error) {
    res.status(500).json({ error: "Get available years failed" });
  }
};

// DELETE SALE
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    await Sale.findByIdAndDelete(id);

    logActivity({
      userId: req.user.id,
      action: "delete",
      module: "sales",
      description: `Deleted sale record for '${sale.itemName}'`,
      targetId: sale._id,
    });

    res.json({ message: "Sale deleted!" });
  } catch (error) {
    res.status(500).json({ error: "Delete sale failed" });
  }
};
