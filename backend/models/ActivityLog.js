const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ["add", "edit", "delete", "sell", "login", "logout", "activate", "deactivate"],
    required: true,
  },
  module: {
    type: String,
    enum: ["inventory", "sales", "users", "auth"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
