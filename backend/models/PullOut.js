const mongoose = require("mongoose");

const pullOutSchema = new mongoose.Schema({
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantityPulledOut: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    enum: ["near_expiry", "expired", "damaged", "spoiled", "other"],
    required: true,
  },
  pulledOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  replacedByItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PullOut", pullOutSchema);
