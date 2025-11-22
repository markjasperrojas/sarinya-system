const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const authMiddleware = require("../middleware/authMiddleware");

// Protected routes
router.post("/add", authMiddleware, inventoryController.addItem);
router.get("/", authMiddleware, inventoryController.getItems);
router.put("/:id", authMiddleware, inventoryController.updateItem);
router.delete("/:id", authMiddleware, inventoryController.deleteItem);

module.exports = router;
