const ActivityLog = require("../models/ActivityLog");
const logger = require("./logger");

const logActivity = ({ userId, action, module, description, targetId }) => {
  ActivityLog.create({ userId, action, module, description, targetId }).catch((err) =>
    logger.error(`Activity log write failed: ${err.message}`)
  );
};

module.exports = logActivity;
