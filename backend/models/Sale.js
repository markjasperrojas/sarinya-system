const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
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
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

saleSchema.virtual("total").get(function () {
  return this.quantity * this.price;
});

module.exports = mongoose.model("Sale", saleSchema);
