const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

module.exports = async function (req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ error: "No token, access denied" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

    // Fetch full user data including role and permissions
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    req.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    logger.warn(`Auth token rejected: ${error.message}`);
    res.status(401).json({ error: "Invalid token" });
  }
};
