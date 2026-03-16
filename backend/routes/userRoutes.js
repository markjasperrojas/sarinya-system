const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Get current user profile (any authenticated user)
router.get("/profile", userController.getProfile);

// All other user management routes require admin role
router.get("/", requireRole("admin"), userController.getUsers);
router.get("/:id", requireRole("admin"), userController.getUser);
router.post("/", requireRole("admin"), userController.createUser);
router.put("/:id", requireRole("admin"), userController.updateUser);
router.delete("/:id", requireRole("admin"), userController.deleteUser);

module.exports = router;
