// Check if user has one of the required roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient role." });
    }

    next();
  };
};

// Check if user has specific permission for a module and action
const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admins have full access
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    // Check specific permission
    const userPermissions = req.user.permissions;
    if (!userPermissions || !userPermissions[module] || !userPermissions[module][action]) {
      return res.status(403).json({
        error: `Access denied. You don't have permission to ${action} ${module}.`
      });
    }

    next();
  };
};

module.exports = { requireRole, requirePermission };
