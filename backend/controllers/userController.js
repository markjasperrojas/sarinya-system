const User = require("../models/User");
const bcrypt = require("bcryptjs");
const logActivity = require("../utils/activityLogger");
const AppError = require("../utils/AppError");

// Get all users
exports.getUsers = async (req, res) => {
  const users = await User.find({ deletedAt: null }).select("-password").sort({ createdAt: -1 });
  res.json(users);
};

// Get single user by ID
exports.getUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, deletedAt: null }).select("-password");

  if (!user) throw new AppError("User not found", 404);

  res.json(user);
};

// Get current user profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) throw new AppError("User not found", 404);

  res.json(user);
};

// Create new user
exports.createUser = async (req, res) => {
  const { username, password, role, isActive } = req.body;

  // Check if username already exists (among non-deleted users)
  const existingUser = await User.findOne({ username, deletedAt: null });
  if (existingUser) {
    throw new AppError("Username already exists", 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    password: hashedPassword,
    role: role || "staff",
    isActive: isActive !== undefined ? isActive : true,
  });

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
};

// Update user
exports.updateUser = async (req, res) => {
  const { username, password, role, isActive } = req.body;

  const user = await User.findOne({ _id: req.params.id, deletedAt: null });

  if (!user) throw new AppError("User not found", 404);

  const wasActive = user.isActive;

  // Check if username is being changed and if it's already taken (among non-deleted users)
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ username, deletedAt: null });
    if (existingUser) {
      throw new AppError("Username already exists", 400);
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
};

// Delete user (soft)
exports.deleteUser = async (req, res) => {
  // Prevent self-deletion
  if (req.params.id === req.user.id.toString()) {
    throw new AppError("Cannot delete your own account", 400);
  }

  const user = await User.findOne({ _id: req.params.id, deletedAt: null });

  if (!user) throw new AppError("User not found", 404);

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
};
