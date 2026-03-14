const mongoose = require("mongoose");
const { CATEGORY_VALUES } = require("../constants/categories");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image_url: {
      type: String,
      default: null,
    },
    categories: {
      type: [String],
      enum: CATEGORY_VALUES,
      default: [],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Uniqueness is enforced at the application level so that soft-deleted
// product names do not block re-creation of the same name.
productSchema.index({ name: 1 }, { collation: { locale: "en", strength: 2 } });

module.exports = mongoose.model("Product", productSchema);
