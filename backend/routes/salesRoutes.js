const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const authMiddleware = require("../middleware/authMiddleware");

// Protected routes
router.post("/add", authMiddleware, salesController.addSale);
router.get("/", authMiddleware, salesController.getSales);
router.put("/:id", authMiddleware, salesController.updateSale);
router.delete("/:id", authMiddleware, salesController.deleteSale);

module.exports = router;
