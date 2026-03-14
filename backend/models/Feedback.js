const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    type: {
      type: String,
      enum: ["bug", "feature_request", "suggestion", "other"],
      required: true,
    },
    title: { type: String, required: true, maxlength: 100, trim: true },
    message: { type: String, required: true, maxlength: 1000, trim: true },
    page: { type: String, default: null },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
