const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");

router.get("/", authMiddleware, requireRole("admin", "staff"), productController.getProducts);
router.post("/add", authMiddleware, requireRole("admin"), productController.addProduct);
router.put("/:id", authMiddleware, requireRole("admin"), productController.updateProduct);
router.delete("/:id", authMiddleware, requireRole("admin"), productController.deleteProduct);

module.exports = router;
