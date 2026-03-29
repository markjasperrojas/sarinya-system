const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
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

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Always return the same response to prevent email enumeration
  const genericResponse = {
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };

  const user = await User.findOne({ email: email?.toLowerCase(), deletedAt: null });

  if (!user) {
    return res.json(genericResponse);
  }

  // Generate raw token and hash for storage
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(rawToken, 10);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  // Send email
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&id=${user._id}`;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Reset your Sarinya Kitchenette password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">Reset Your Password</h2>
        <p>Hi <strong>${user.username}</strong>,</p>
        <p>You requested a password reset for your Sarinya Kitchenette account. Click the button below to set a new password.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Sarinya Kitchenette Inventory &amp; Sales System</p>
      </div>
    `,
  });

  res.json(genericResponse);
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { userId, token, newPassword } = req.body;

  if (!userId || !token || !newPassword) {
    throw new AppError("Missing required fields", 400);
  }

  const user = await User.findOne({ _id: userId, deletedAt: null });

  if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
    throw new AppError("Invalid or expired reset link", 400);
  }

  if (user.resetPasswordExpires < Date.now()) {
    throw new AppError("Reset link has expired", 400);
  }

  const isValid = await bcrypt.compare(token, user.resetPasswordToken);

  if (!isValid) {
    throw new AppError("Invalid or expired reset link", 400);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  logActivity({
    userId: user._id,
    username: user.username,
    action: "reset_password",
    module: "auth",
    description: `User '${user.username}' reset their password`,
  });

  res.json({ message: "Password reset successfully" });
};
