const express = require("express");
const router = express.Router();
const { createFeedback, getFeedback } = require("../controllers/feedbackController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");

// Any authenticated user can submit feedback
router.post("/", authMiddleware, createFeedback);

// Admin only — list all feedback (for future review page)
router.get("/", authMiddleware, requireRole("admin"), getFeedback);

module.exports = router;
