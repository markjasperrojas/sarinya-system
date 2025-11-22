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
exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1 });
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
