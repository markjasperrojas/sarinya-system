const ActivityLog = require("../models/ActivityLog");

const logActivity = ({ userId, action, module, description, targetId }) => {
  ActivityLog.create({ userId, action, module, description, targetId }).catch(
    (err) => console.error("Activity log error:", err.message)
  );
};

module.exports = logActivity;
