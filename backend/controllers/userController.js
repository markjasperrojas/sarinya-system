const User = require("../models/User");
const bcrypt = require("bcryptjs");
const logActivity = require("../utils/activityLogger");

const defaultStaffPermissions = {
  inventory: { view: true, add: false, edit: false, delete: false },
  sales: { view: true, add: true, edit: false, delete: false },
  users: { view: false, add: false, edit: false, delete: false },
};

const adminPermissions = {
  inventory: { view: true, add: true, edit: true, delete: true },
  sales: { view: true, add: true, edit: true, delete: true },
  users: { view: true, add: true, edit: true, delete: true },
};

// Get default permissions
exports.getDefaultPermissions = (req, res) => {
  res.json({ defaultStaffPermissions, adminPermissions });
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ deletedAt: null }).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get single user by ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, deletedAt: null }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, permissions, isActive } = req.body;

    // Check if username already exists (among non-deleted users)
    const existingUser = await User.findOne({ username, deletedAt: null });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with provided or default values
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || "staff",
      permissions: permissions || undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    // If role is admin, grant all permissions
    if (role === "admin") {
      newUser.permissions = adminPermissions;
    }

    await newUser.save();

    logActivity({
      userId: req.user.id,
      action: "add",
      module: "users",
      description: `Created user '${username}' with role '${newUser.role}'`,
      targetId: newUser._id,
    });

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { username, password, role, permissions, isActive } = req.body;

    const user = await User.findOne({ _id: req.params.id, deletedAt: null });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const wasActive = user.isActive;

    // Check if username is being changed and if it's already taken (among non-deleted users)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username, deletedAt: null });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      user.username = username;
    }

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Update role if provided
    if (role) {
      user.role = role;
      // If changing to admin, grant all permissions
      if (role === "admin") {
        user.permissions = adminPermissions;
      }
    }

    // Update permissions if provided and not admin
    if (permissions && user.role !== "admin") {
      user.permissions = permissions;
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();

    if (isActive !== undefined && isActive !== wasActive) {
      logActivity({
        userId: req.user.id,
        action: isActive ? "activate" : "deactivate",
        module: "users",
        description: `${isActive ? "Activated" : "Deactivated"} user '${user.username}'`,
        targetId: user._id,
      });
    } else {
      logActivity({
        userId: req.user.id,
        action: "edit",
        module: "users",
        description: `Updated user '${user.username}'`,
        targetId: user._id,
      });
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete user (soft)
exports.deleteUser = async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await User.findOne({ _id: req.params.id, deletedAt: null });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();

    logActivity({
      userId: req.user.id,
      action: "delete",
      module: "users",
      description: `Deleted user '${user.username}'`,
      targetId: user._id,
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};
