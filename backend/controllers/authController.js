const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logActivity = require("../utils/activityLogger");
const AppError = require("../utils/AppError");

// REGISTER (only once)
exports.register = async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    password: hashedPassword,
  });

  await newUser.save();

  res.json({ message: "User registered successfully!" });
};

// LOGIN
exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) throw new AppError("User not found", 400);

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new AppError("Wrong password", 400);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  logActivity({
    userId: user._id,
    username: user.username,
    action: "login",
    module: "auth",
    description: `User '${user.username}' logged in`,
  });

  res.json({
    message: "Login successful!",
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    },
  });
};

// LOGOUT
exports.logout = async (req, res) => {
  logActivity({
    userId: req.user.id,
    action: "logout",
    module: "auth",
    description: `User '${req.user.username}' logged out`,
  });

  res.json({ message: "Logged out successfully" });
};
