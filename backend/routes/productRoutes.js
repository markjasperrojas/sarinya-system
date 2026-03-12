const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

router.get("/", authMiddleware, requirePermission("inventory", "view"), productController.getProducts);
router.post("/add", authMiddleware, requirePermission("inventory", "add"), productController.addProduct);
router.put("/:id", authMiddleware, requirePermission("inventory", "edit"), productController.updateProduct);
router.delete("/:id", authMiddleware, requirePermission("inventory", "delete"), productController.deleteProduct);

module.exports = router;
