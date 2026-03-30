const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");
const activityLogController = require("../controllers/activityLogController");

router.get("/report", authMiddleware, requireRole("admin"), activityLogController.getUserActivityReport);
router.get("/", authMiddleware, requireRole("admin"), activityLogController.getActivityLogs);

module.exports = router;
