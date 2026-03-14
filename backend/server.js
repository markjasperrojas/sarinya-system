require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

// Routes
const authRoutes = require("./routes/authRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const salesRoutes = require("./routes/salesRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// CORS — in production, restrict to the frontend origin via ALLOWED_ORIGINS env var.
// In development (no env var set), allow all origins.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests and health check pings (no origin header)
      if (!origin) return callback(null, true);
      // Dev mode: allow everything when ALLOWED_ORIGINS is not configured
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/feedback", feedbackRoutes);

// Health check — used by cron pings to prevent Render free-tier cold starts
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root
app.get("/", (req, res) => {
  res.json({ message: "Sarinya API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  if (!isOperational) {
    logger.error(`${req.method} ${req.url} — ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.url} — ${status} ${err.message}`);
  }

  res.status(status).json({ error: err.message });
});

// Catch unhandled promise rejections — log and keep the process alive
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

// Catch synchronous exceptions that escaped all try/catch — log then exit cleanly
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception — shutting down", { stack: err.stack });
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
