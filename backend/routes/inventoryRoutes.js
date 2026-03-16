const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");

// Protected routes with role checks
router.get("/", authMiddleware, requireRole("admin", "staff"), inventoryController.getItems);
router.get("/pullouts", authMiddleware, requireRole("admin", "staff"), inventoryController.getPullOuts);
router.post("/add", authMiddleware, requireRole("admin", "staff"), inventoryController.addItem);
router.put("/:id", authMiddleware, requireRole("admin"), inventoryController.updateItem);
router.delete("/:id", authMiddleware, requireRole("admin"), inventoryController.deleteItem);
router.post("/:id/sell", authMiddleware, requireRole("admin", "staff"), inventoryController.sellItem);
router.post("/:id/pullout", authMiddleware, requireRole("admin"), inventoryController.pullOutItem);

module.exports = router;
