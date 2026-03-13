const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      // unique is enforced at the application level so soft-deleted usernames
      // do not block re-creation of the same username.
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },
    permissions: {
      inventory: {
        view: { type: Boolean, default: true },
        add: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      sales: {
        view: { type: Boolean, default: true },
        add: { type: Boolean, default: true },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      users: {
        view: { type: Boolean, default: false },
        add: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
