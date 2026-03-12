const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "pulled_out"],
    default: "active",
  },
  pullOutReason: {
    type: String,
  },
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
  },
  replacedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Inventory", inventorySchema);
