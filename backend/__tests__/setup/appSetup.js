/**
 * Express app for testing — does NOT call connectDB().
 * The test database connection is managed by jest.setup.js (globalSetup/globalTeardown).
 */
const express = require("express");

const authRoutes = require("../../routes/authRoutes");
const inventoryRoutes = require("../../routes/inventoryRoutes");
const salesRoutes = require("../../routes/salesRoutes");
const productRoutes = require("../../routes/productRoutes");
const userRoutes = require("../../routes/userRoutes");
const activityLogRoutes = require("../../routes/activityLogRoutes");
const feedbackRoutes = require("../../routes/feedbackRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/feedback", feedbackRoutes);

// Error handler — mirrors server.js
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message });
});

module.exports = app;
