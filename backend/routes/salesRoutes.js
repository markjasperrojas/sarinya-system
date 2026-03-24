const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");

// Protected routes with role checks
router.get("/analytics/monthly", authMiddleware, requireRole("admin", "staff"), salesController.getMonthlySales);
router.get("/analytics/daily", authMiddleware, requireRole("admin", "staff"), salesController.getDailySales);
router.get("/analytics/years", authMiddleware, requireRole("admin", "staff"), salesController.getAvailableYears);
router.get("/sessions/recent", authMiddleware, requireRole("admin", "staff"), salesController.getRecentSessions);
router.get("/sessions/:sessionId", authMiddleware, requireRole("admin", "staff"), salesController.getSessionDetail);
router.post("/sessions/:sessionId/add-items", authMiddleware, requireRole("admin", "staff"), salesController.addItemsToSession);
router.patch("/sessions/:sessionId/update-item-qty", authMiddleware, requireRole("admin", "staff"), salesController.updateSessionItemQty);
router.delete("/sessions/:sessionId/remove-item/:saleId", authMiddleware, requireRole("admin", "staff"), salesController.removeSessionItem);
router.get("/", authMiddleware, requireRole("admin", "staff"), salesController.getSales);
router.post("/bulk-sell", authMiddleware, requireRole("admin", "staff"), salesController.bulkSell);
router.post("/add", authMiddleware, requireRole("admin", "staff"), salesController.addSale);
router.put("/:id", authMiddleware, requireRole("admin"), salesController.updateSale);
router.delete("/:id", authMiddleware, requireRole("admin"), salesController.deleteSale);

module.exports = router;
