const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const authMiddleware = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

// Protected routes with permission checks
router.get("/", authMiddleware, requirePermission("inventory", "view"), inventoryController.getItems);
router.get("/pullouts", authMiddleware, requirePermission("inventory", "view"), inventoryController.getPullOuts);
router.post("/add", authMiddleware, requirePermission("inventory", "add"), inventoryController.addItem);
router.put("/:id", authMiddleware, requirePermission("inventory", "edit"), inventoryController.updateItem);
router.delete("/:id", authMiddleware, requirePermission("inventory", "delete"), inventoryController.deleteItem);
router.post("/:id/sell", authMiddleware, requirePermission("sales", "add"), inventoryController.sellItem);
router.post("/:id/pullout", authMiddleware, requirePermission("inventory", "edit"), inventoryController.pullOutItem);

module.exports = router;
