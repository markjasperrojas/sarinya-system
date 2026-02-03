const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const authMiddleware = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

// Protected routes with permission checks
router.get("/", authMiddleware, requirePermission("sales", "view"), salesController.getSales);
router.post("/add", authMiddleware, requirePermission("sales", "add"), salesController.addSale);
router.put("/:id", authMiddleware, requirePermission("sales", "edit"), salesController.updateSale);
router.delete("/:id", authMiddleware, requirePermission("sales", "delete"), salesController.deleteSale);

module.exports = router;
