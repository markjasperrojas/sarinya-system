const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    saleSessionId: {
      type: String,
      default: null,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

saleSchema.virtual("total").get(function () {
  return this.quantity * this.price;
});

module.exports = mongoose.model("Sale", saleSchema);
