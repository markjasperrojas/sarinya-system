const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole, requirePermission } = require("../middleware/permissionMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Get current user profile (any authenticated user)
router.get("/profile", userController.getProfile);

// List all users (requires users.view permission)
router.get("/", requirePermission("users", "view"), userController.getUsers);

// Get single user (requires users.view permission)
router.get("/:id", requirePermission("users", "view"), userController.getUser);

// Create user (requires users.add permission)
router.post("/", requirePermission("users", "add"), userController.createUser);

// Update user (requires users.edit permission)
router.put("/:id", requirePermission("users", "edit"), userController.updateUser);

// Delete user (requires users.delete permission)
router.delete("/:id", requirePermission("users", "delete"), userController.deleteUser);

module.exports = router;
