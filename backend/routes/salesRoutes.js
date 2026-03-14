const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const authMiddleware = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

// Protected routes with permission checks
router.get("/analytics/monthly", authMiddleware, requirePermission("sales", "view"), salesController.getMonthlySales);
router.get("/analytics/daily", authMiddleware, requirePermission("sales", "view"), salesController.getDailySales);
router.get("/analytics/years", authMiddleware, requirePermission("sales", "view"), salesController.getAvailableYears);
router.get("/sessions/recent", authMiddleware, requirePermission("sales", "view"), salesController.getRecentSessions);
router.get("/sessions/:sessionId", authMiddleware, requirePermission("sales", "view"), salesController.getSessionDetail);
router.post("/sessions/:sessionId/add-items", authMiddleware, requirePermission("sales", "add"), salesController.addItemsToSession);
router.delete("/sessions/:sessionId/remove-item/:saleId", authMiddleware, requirePermission("sales", "delete"), salesController.removeSessionItem);
router.get("/", authMiddleware, requirePermission("sales", "view"), salesController.getSales);
router.post("/bulk-sell", authMiddleware, requirePermission("sales", "add"), salesController.bulkSell);
router.post("/add", authMiddleware, requirePermission("sales", "add"), salesController.addSale);
router.put("/:id", authMiddleware, requirePermission("sales", "edit"), salesController.updateSale);
router.delete("/:id", authMiddleware, requirePermission("sales", "delete"), salesController.deleteSale);

module.exports = router;
