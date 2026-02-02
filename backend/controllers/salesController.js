const Sale = require("../models/Sale");

// CREATE SALE
exports.addSale = async (req, res) => {
  try {
    const { itemName, quantity, price } = req.body;

    const total = quantity * price;

    const sale = new Sale({ itemName, quantity, price, total });
    await sale.save();

    res.json({ message: "Sale recorded!", sale });
  } catch (error) {
    res.status(500).json({ error: "Add sale failed" });
  }
};

// READ ALL SALES
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

    const total = quantity * price;

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      { itemName, quantity, price, total },
      { new: true }
    );

    res.json({ message: "Sale updated!", updatedSale });
  } catch (error) {
    res.status(500).json({ error: "Update sale failed" });
  }
};

// DELETE SALE
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    await Sale.findByIdAndDelete(id);

    res.json({ message: "Sale deleted!" });
  } catch (error) {
    res.status(500).json({ error: "Delete sale failed" });
  }
};
